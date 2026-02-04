
'use server'

import { createClient } from '@/lib/supabase/server'
import { AutomationRule } from './types'
import { revalidatePath } from 'next/cache'
import { sendWhatsAppMessage } from '@/lib/whatsapp'
import { sendEmail } from '@/lib/email'

export async function createAutomation(rule: AutomationRule) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const { data: profile } = await supabase
        .from('user_profiles')
        .select('school_id')
        .eq('id', user.id)
        .single()

    if (!profile?.school_id) return { error: 'No school linked' }

    const { error } = await supabase
        .from('automations')
        .insert({
            school_id: profile.school_id,
            name: rule.name,
            description: rule.description,
            trigger_type: rule.trigger_type,
            conditions: rule.conditions,
            actions: rule.actions,
            is_active: rule.is_active
        })

    if (error) {
        console.error('Create Automation Error:', error)
        return { error: error.message }
    }

    revalidatePath('/dashboard/automations')
    return { success: true }
}

export async function updateAutomation(id: string, rule: AutomationRule) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const { error } = await supabase
        .from('automations')
        .update({
            name: rule.name,
            description: rule.description,
            trigger_type: rule.trigger_type,
            conditions: rule.conditions,
            actions: rule.actions,
            is_active: rule.is_active,
            updated_at: new Date().toISOString()
        })
        .eq('id', id)

    if (error) return { error: error.message }

    revalidatePath('/dashboard/automations')
    return { success: true }
}

export async function deleteAutomation(id: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const { error } = await supabase
        .from('automations')
        .delete()
        .eq('id', id)

    if (error) return { error: error.message }

    revalidatePath('/dashboard/automations')
    return { success: true }
}

export async function toggleAutomationStatus(id: string, isActive: boolean) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const { error } = await supabase
        .from('automations')
        .update({ is_active: isActive })
        .eq('id', id)

    if (error) return { error: error.message }

    revalidatePath('/dashboard/automations')
    return { success: true }
}

export async function batchUpdateAutomations(ids: string[], action: 'activate' | 'deactivate' | 'delete') {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    let error;

    if (action === 'delete') {
        const { error: deleteError } = await supabase
            .from('automations')
            .delete()
            .in('id', ids)
        error = deleteError
    } else {
        const isActive = action === 'activate'
        const { error: updateError } = await supabase
            .from('automations')
            .update({ is_active: isActive })
            .in('id', ids)
        error = updateError
    }

    if (error) return { error: error.message }

    revalidatePath('/dashboard/automations')
    return { success: true }
}

// --- Evaluation Logic ---

export async function checkAndRunAutomations(triggerType: string, context: any) {
    const supabase = await createClient()

    // 1. Fetch active rules for this trigger
    // Note: In a real scenario, we'd filter by school_id from context or fetch all relevant rules
    // For now, let's assume we run this in a background job that iterates schools or we pass school_id
    if (!context.school_id) {
        console.error('Context missing school_id')
        return
    }

    const { data: rules } = await supabase
        .from('automations')
        .select('*')
        .eq('school_id', context.school_id)
        .eq('trigger_type', triggerType)
        .eq('is_active', true)

    if (!rules || rules.length === 0) return

    console.log(`Found ${rules.length} rules for ${triggerType}`)

    for (const rule of rules) {
        const isMatch = evaluateConditionGroup(rule.conditions, context)
        if (isMatch) {
            console.log(`Rule "${rule.name}" matched! Executing actions...`)
            await executeActions(rule.actions, context)
        }
    }
}

function evaluateConditionGroup(group: any, context: any): boolean {
    if (!group.conditions || group.conditions.length === 0) return true // No conditions = always run

    const results = group.conditions.map((condition: any) => {
        if (condition.type === 'group') {
            return evaluateConditionGroup(condition, context)
        }
        return evaluateCondition(condition, context)
    })

    if (group.logic === 'AND') {
        return results.every((r: boolean) => r === true)
    } else { // OR
        return results.some((r: boolean) => r === true)
    }
}

function evaluateCondition(condition: any, context: any): boolean {
    const { field, operator, value } = condition
    const contextValue = getNestedValue(context, field)

    // Handle different data types if needed (numbers, dates)
    // For now, simple string/number comparison

    switch (operator) {
        case 'equals': return contextValue == value
        case 'not_equals': return contextValue != value
        case 'greater_than': return Number(contextValue) > Number(value)
        case 'less_than': return Number(contextValue) < Number(value)
        case 'greater_than_or_equal': return Number(contextValue) >= Number(value)
        case 'less_than_or_equal': return Number(contextValue) <= Number(value)
        case 'contains': return String(contextValue).includes(String(value))
        default: return false
    }
}

function getNestedValue(obj: any, path: string) {
    return path.split('.').reduce((o, k) => (o || {})[k], obj)
}



// ...

export async function testAutomation(id: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const { data: rule } = await supabase
        .from('automations')
        .select('*')
        .eq('id', id)
        .single()

    if (!rule) return { error: 'Rule not found' }

    // Try to find a student with pending fees to use as real test data
    // This makes the test more realistic as requested by the user
    const { data: realStudentFee } = await supabase
        .from('student_fees')
        .select(`
            *,
            students (
                *,
                classes (name),
                sections (name)
            )
        `)
        .eq('school_id', rule.school_id)
        .gt('amount_due', 0)
        .limit(1)
        .single()

    let testContext;

    if (realStudentFee && realStudentFee.students) {
        const student = realStudentFee.students
        testContext = {
            student: {
                ...student,
                class_id: student.classes?.name, // Map to name for rules
                section_id: student.sections?.name,
                name: `${student.first_name} ${student.last_name}`,
                email: student.email
            },
            email: student.email,
            fee: {
                amount_due: realStudentFee.amount_due,
                amount_paid: realStudentFee.amount_paid,
                days_overdue: 0 // We'd need to calc this, but 0 is safe for now
            },
            phone: student.father_phone || student.mother_phone
        }
        console.log(`Using real student data for test: ${student.first_name}`)
    } else {
        // Fallback if no data found
        console.log('No students with due fees found, using mock data')
        testContext = {
            student: {
                class_id: 'Class 10',
                section_id: 'A',
                gender: 'Male',
                name: 'Test Student',
                email: user.email
            },
            email: user.email,
            fee: {
                amount_due: 5000,
                days_overdue: 10
            },
            phone: '919876543210'
        }
    }

    console.log(`Testing Rule: ${rule.name}`)
    const isMatch = evaluateConditionGroup(rule.conditions, testContext)

    if (isMatch) {
        const results = await executeActions(rule.actions, testContext)
        const successCount = results.filter(r => r.success).length
        return {
            success: true,
            message: `Conditions met for ${testContext.student.name}! ${successCount}/${rule.actions.length} actions executed.`
        }
    } else {
        return {
            success: false,
            message: `Conditions NOT met for ${testContext.student.name}. Try adjusting the rule or data.`
        }
    }
}

async function executeActions(actions: any[], context: any) {
    const results = []
    for (const action of actions) {
        try {
            switch (action.type) {
                case 'SEND_WHATSAPP':
                    console.log('Executing Action: SEND_WHATSAPP', action.params)
                    const to = context.phone || '919876543210'
                    const template = action.params.message || 'hello_world'
                    await sendWhatsAppMessage(to, template)
                    results.push({ success: true, type: 'SEND_WHATSAPP' })
                    break

                case 'SEND_EMAIL':
                    console.log('Executing Action: SEND_EMAIL', action.params)
                    const emailTo = context.student?.email || context.email
                    const subject = action.params.subject || 'Notification from School'
                    // UI likely saves 'message' for generic text areas, check rule-builder.tsx
                    // If the user uses the generic "message" field in the UI, we should use that.
                    const body = action.params.body || action.params.message || 'Hello'

                    if (emailTo) {
                        const res = await sendEmail(emailTo, subject, body)
                        if (res.success) {
                            results.push({ success: true, type: 'SEND_EMAIL' })
                        } else {
                            console.error('Email failed:', res.error)
                            results.push({ success: false, type: 'SEND_EMAIL', error: res.error })
                        }
                    } else {
                        console.log('No email address found for context')
                        results.push({ success: false, type: 'SEND_EMAIL', error: 'No email address' })
                    }
                    break
                case 'SEND_SMS':
                    console.log('Executing Action: SEND_SMS', action.params)
                    results.push({ success: true, type: 'SEND_SMS' }) // Mock success
                    break
            }
        } catch (error) {
            console.error(`Failed to execute action ${action.type}`, error)
            results.push({ success: false, type: action.type, error })
        }
    }
    return results
}
