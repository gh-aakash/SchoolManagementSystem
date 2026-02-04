'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { gatewayFetch } from '@/lib/gateway'
import { checkAndRunAutomations } from '../automations/actions'

export async function createFeeHead(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const { data: profile } = await supabase
        .from('user_profiles')
        .select('school_id')
        .eq('id', user.id)
        .single()

    if (!profile?.school_id) return { error: 'No school linked' }

    const name = formData.get('name') as string
    const description = formData.get('description') as string
    const amount = Number(formData.get('amount'))

    try {
        await gatewayFetch('/api/finance/fee-heads', {
            method: 'POST',
            body: JSON.stringify({
                school_id: profile.school_id,
                name,
                description,
                amount
            })
        })

        revalidatePath('/dashboard/fees')
        return { success: true }
    } catch (error: any) {
        return { error: error.message }
    }
}

export async function createFeeStructure(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const { data: profile } = await supabase
        .from('user_profiles')
        .select('school_id')
        .eq('id', user.id)
        .single()

    if (!profile?.school_id) return { error: 'No school linked' }
    const schoolId = profile.school_id

    const months = formData.getAll('months') as string[]
    const frequency = formData.get('frequency') as string
    const classIds = formData.getAll('class_ids') as string[]
    const feeHeadId = formData.get('fee_head_id') as string
    const amount = formData.get('amount') as string
    const dueDate = formData.get('due_date') as string

    try {
        // 1. Get Active Academic Year from Identity
        const activeYear = await gatewayFetch(`/api/identity/academic-years/active?school_id=${schoolId}`)

        // 2. Create Batch Structures via Finance Service
        const createdStructures = await gatewayFetch('/api/finance/fee-structures/batch', {
            method: 'POST',
            body: JSON.stringify({
                school_id: schoolId,
                class_ids,
                fee_head_id: feeHeadId,
                academic_year_id: activeYear.id,
                amount,
                frequency,
                months,
                due_date: dueDate
            })
        })

        // 3. Assign Fees to Students via Finance Service
        for (const classId of classIds) {
            const structureIdsForClass = createdStructures
                .filter((s: any) => s.class_id === classId)
                .map((s: any) => s.id)

            await gatewayFetch('/api/finance/assign-fees', {
                method: 'POST',
                body: JSON.stringify({
                    school_id: schoolId,
                    structure_ids: structureIdsForClass,
                    class_id: classId
                })
            })
        }

        revalidatePath('/dashboard/fees')
        return { success: true }
    } catch (error: any) {
        console.error('Create Fee Structure Error:', error)
        return { error: error.message }
    }
}

export async function collectFee(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const { data: profile } = await supabase
        .from('user_profiles')
        .select('school_id')
        .eq('id', user.id)
        .single()

    if (!profile?.school_id) return { error: 'No school linked' }

    const selectedFeeIds = formData.get('selected_fee_ids') ? JSON.parse(formData.get('selected_fee_ids') as string) : []
    const studentId = formData.get('student_id') as string
    const amount = formData.get('amount') as string
    const paymentMode = formData.get('payment_mode') as string
    const remarks = formData.get('remarks') as string

    if (!studentId || !amount || !paymentMode) {
        return { error: 'Required fields missing' }
    }

    try {
        const transaction = await gatewayFetch('/api/finance/collect-fee', {
            method: 'POST',
            body: JSON.stringify({
                school_id: profile.school_id,
                student_id: studentId,
                amount,
                payment_mode: paymentMode,
                remarks,
                selected_fee_ids: selectedFeeIds
            })
        })

        // Trigger Automation: FEE_PAID (Background)
        // We still need student details for context
        const { data: student } = await supabase
            .from('students')
            .select('*, classes(name), sections(name)')
            .eq('id', studentId)
            .single()

        if (student) {
            const context = {
                school_id: profile.school_id,
                student: {
                    ...student,
                    class_id: student.classes?.name,
                    section_id: student.sections?.name
                },
                fee: {
                    amount_paid: parseFloat(amount),
                    payment_mode: paymentMode,
                    last_payment_date: new Date().toISOString()
                },
                phone: student.father_phone || student.mother_phone
            }
            checkAndRunAutomations('FEE_PAID', context).catch(console.error)
        }

        revalidatePath('/dashboard/fees/collect')
        return { message: 'Fee collected successfully', data: transaction }
    } catch (error: any) {
        return { error: error.message }
    }
}

export async function getStudentPendingFees(studentId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const { data: fees, error } = await supabase
        .from('student_fees')
        .select(`
            id,
            amount_due,
            amount_paid,
            status,
            fee_structure:fee_structures (
                amount,
                due_date,
                fee_head:fee_heads (
                    name
                )
            )
        `)
        .eq('student_id', studentId)
        .neq('status', 'paid')
    // We can't easily sort by nested field in Supabase JS client without a join, 
    // but we can sort in JS. 
    // Actually we can: .order('fee_structures(due_date)') might work if foreign key is detected, 
    // but often tricky. Let's sort in client or here.

    if (error) return { error: error.message }

    // Sort by due date
    const sortedFees = fees?.sort((a: any, b: any) => {
        const dateA = new Date(a.fee_structure?.due_date || 0).getTime()
        const dateB = new Date(b.fee_structure?.due_date || 0).getTime()
        return dateA - dateB
    })

    return { data: sortedFees }
}

export async function assignFeeToClass(formData: FormData) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const { data: profile } = await supabase
        .from('user_profiles')
        .select('school_id')
        .eq('id', user.id)
        .single()

    if (!profile?.school_id) return { error: 'No school linked' }

    const classId = formData.get('class_id') as string
    const feeHeadId = formData.get('fee_head_id') as string
    const amount = parseFloat(formData.get('amount') as string)
    const dueDate = formData.get('due_date') as string

    if (!classId || !feeHeadId || !amount || !dueDate) {
        return { error: 'All fields are required' }
    }

    // 1. Get Active Academic Year
    const { data: activeYear } = await supabase
        .from('academic_years')
        .select('id')
        .eq('school_id', profile.school_id)
        .eq('is_active', true)
        .single()

    if (!activeYear) return { error: 'No active academic year found' }

    // 2. Create or Update Fee Structure
    // Check if structure exists
    const { data: existingStructure } = await supabase
        .from('fee_structures')
        .select('id')
        .eq('school_id', profile.school_id)
        .eq('class_id', classId)
        .eq('fee_head_id', feeHeadId)
        .eq('academic_year_id', activeYear.id)
        .single()

    let structureId = existingStructure?.id

    if (structureId) {
        // Update existing
        await supabase
            .from('fee_structures')
            .update({ amount, due_date: dueDate })
            .eq('id', structureId)
    } else {
        // Create new
        const { data: newStructure, error: structureError } = await supabase
            .from('fee_structures')
            .insert({
                school_id: profile.school_id,
                class_id: classId,
                fee_head_id: feeHeadId,
                academic_year_id: activeYear.id,
                amount,
                due_date: dueDate
            })
            .select('id')
            .single()

        if (structureError) return { error: 'Failed to create fee structure: ' + structureError.message }
        structureId = newStructure.id
    }

    // 3. Get Students in Class
    const { data: students } = await supabase
        .from('students')
        .select('id')
        .eq('school_id', profile.school_id)
        .eq('current_class_id', classId)
        .eq('is_active', true)

    if (!students || students.length === 0) {
        return { message: 'Fee structure saved, but no students found in this class.' }
    }

    // 4. Assign Fee to Students (Avoid duplicates)
    let assignedCount = 0
    for (const student of students) {
        // Check if already assigned
        const { data: existingFee } = await supabase
            .from('student_fees')
            .select('id')
            .eq('student_id', student.id)
            .eq('fee_structure_id', structureId)
            .single()

        if (!existingFee) {
            await supabase
                .from('student_fees')
                .insert({
                    school_id: profile.school_id,
                    student_id: student.id,
                    fee_structure_id: structureId,
                    amount_due: amount,
                    amount_paid: 0,
                    status: 'pending'
                })
            assignedCount++
        }
    }

    revalidatePath('/dashboard/fees/assign')
    return { message: `Successfully assigned fee to ${assignedCount} students.` }
}

export async function deleteFeeStructure(id: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    try {
        await gatewayFetch(`/api/finance/fee-structures/${id}`, {
            method: 'DELETE'
        })

        revalidatePath('/dashboard/fees/structure')
        return { message: 'Fee structure deleted' }
    } catch (error: any) {
        return { error: error.message }
    }
}

export async function syncFeeStructure(structureId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const { data: profile } = await supabase
        .from('user_profiles')
        .select('school_id')
        .eq('id', user.id)
        .single()

    if (!profile?.school_id) return { error: 'No school linked' }

    try {
        const result = await gatewayFetch(`/api/finance/fee-structures/${structureId}/sync`, {
            method: 'POST',
            body: JSON.stringify({ school_id: profile.school_id })
        })

        revalidatePath('/dashboard/fees/structure')
        return { message: `Synced: Assigned fee to ${result.assignedCount} new students.` }
    } catch (error: any) {
        return { error: error.message }
    }
}

export async function getFeeRecords(filters: any) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const { data: profile } = await supabase
        .from('user_profiles')
        .select('school_id')
        .eq('id', user.id)
        .single()

    if (!profile?.school_id) return { error: 'No school linked' }

    const queryParams = new URLSearchParams({
        school_id: profile.school_id,
        ...filters
    })

    try {
        const data = await gatewayFetch(`/api/finance/fee-records?${queryParams.toString()}`)
        return { data }
    } catch (error: any) {
        return { error: error.message }
    }
}

export async function getFeeTransactions(filters: any) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const { data: profile } = await supabase
        .from('user_profiles')
        .select('school_id')
        .eq('id', user.id)
        .single()

    if (!profile?.school_id) return { error: 'No school linked' }

    const queryParams = new URLSearchParams({
        school_id: profile.school_id,
        ...filters
    })

    try {
        const data = await gatewayFetch(`/api/finance/transactions/history?${queryParams.toString()}`)
        return { data }
    } catch (error: any) {
        return { error: error.message }
    }
}
