'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { checkAndRunAutomations } from '../automations/actions'

export async function createFeeHead(formData: FormData) {
    const supabase = createClient()
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

    if (!name) return { error: 'Name is required' }

    const { error } = await supabase
        .from('fee_heads')
        .insert({
            school_id: profile.school_id,
            name,
            description
        })

    if (error) return { error: error.message }

    revalidatePath('/dashboard/fees/structure')
    return { message: 'Fee Head created' }
}

export async function createFeeStructure(formData: FormData) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const { data: profile } = await supabase
        .from('user_profiles')
        .select('school_id')
        .eq('id', user.id)
        .single()

    if (!profile?.school_id) return { error: 'No school linked' }

    const months = formData.getAll('months') as string[]
    const frequency = formData.get('frequency') as string
    const classIds = formData.getAll('class_ids') as string[]
    const feeHeadId = formData.get('fee_head_id') as string
    const amount = formData.get('amount') as string
    const dueDate = formData.get('due_date') as string

    if (classIds.length === 0 || !feeHeadId || !amount) {
        return { error: 'Please select at least one class, fee head and amount' }
    }

    if (frequency === 'one-time' && !dueDate) {
        return { error: 'Due date is required for one-time fees' }
    }

    if (frequency === 'monthly' && months.length === 0) {
        return { error: 'Please select at least one month' }
    }

    // Get Active Academic Year
    const { data: activeYear } = await supabase
        .from('academic_years')
        .select('id, start_date, end_date')
        .eq('school_id', profile.school_id)
        .eq('is_active', true)
        .single()

    if (!activeYear) return { error: 'No active academic year found' }

    const feeStructures = []
    const academicStartYear = new Date(activeYear.start_date).getFullYear()
    // Assume academic year starts in April (Month 3 in JS Date)
    // If start_date is not set, default to current year

    for (const classId of classIds) {
        if (frequency === 'monthly') {
            for (const monthStr of months) {
                const month = parseInt(monthStr) // 1-12
                // Calculate year: 
                // If month is 4, 5, ... 12 -> academicStartYear
                // If month is 1, 2, 3 -> academicStartYear + 1
                // This logic assumes April-March cycle. 
                // Better logic: compare with start month.
                const startMonth = new Date(activeYear.start_date).getMonth() + 1 // 1-12

                let year = academicStartYear
                if (month < startMonth) {
                    year = academicStartYear + 1
                }

                // Create date: 10th of the month
                // month is 1-based, Date constructor takes 0-based
                const due = new Date(year, month - 1, 10)
                // Adjust for timezone offset to avoid previous day? 
                // Set to noon to be safe
                due.setHours(12, 0, 0, 0)

                feeStructures.push({
                    school_id: profile.school_id,
                    class_id: classId,
                    fee_head_id: feeHeadId,
                    academic_year_id: activeYear.id,
                    amount: parseFloat(amount),
                    due_date: due.toISOString().split('T')[0]
                })
            }
        } else {
            feeStructures.push({
                school_id: profile.school_id,
                class_id: classId,
                fee_head_id: feeHeadId,
                academic_year_id: activeYear.id,
                amount: parseFloat(amount),
                due_date: dueDate
            })
        }
    }

    const { data: createdStructures, error } = await supabase
        .from('fee_structures')
        .insert(feeStructures)
        .select()

    if (error) return { error: error.message }

    // Auto-assign to existing students in these classes
    if (createdStructures && createdStructures.length > 0) {
        for (const structure of createdStructures) {
            const { data: students } = await supabase
                .from('students')
                .select('id')
                .eq('school_id', profile.school_id)
                .eq('current_class_id', structure.class_id)
                .eq('is_active', true)

            if (students && students.length > 0) {
                const studentFees = students.map(student => ({
                    school_id: profile.school_id,
                    student_id: student.id,
                    fee_structure_id: structure.id,
                    amount_due: structure.amount,
                    amount_paid: 0,
                    status: 'pending'
                }))

                await supabase.from('student_fees').insert(studentFees)
            }
        }
    }

    revalidatePath('/dashboard/fees/structure')
    return { message: `Fee Structure created and assigned to students in ${classIds.length} classes` }
}

export async function collectFee(formData: FormData) {
    const supabase = createClient()
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

    // import { checkAndRunAutomations } from '../automations/actions' // Moved to top

    // ...

    const { data: transaction, error } = await supabase
        .from('fee_transactions')
        .insert({
            school_id: profile.school_id,
            student_id: studentId,
            amount: parseFloat(amount),
            payment_mode: paymentMode,
            remarks
        })
        .select('id')
        .single()

    if (error) return { error: error.message }

    // Update Student Fee Status
    let query = supabase
        .from('student_fees')
        .select('*, fee_structure:fee_structures(due_date)')
        .eq('student_id', studentId)
        .neq('status', 'paid')

    if (selectedFeeIds.length > 0) {
        query = query.in('id', selectedFeeIds)
    }

    const { data: studentFees } = await query

    // Sort by due date
    const sortedFees = studentFees?.sort((a, b) => {
        const dateA = new Date(a.fee_structure?.due_date || 0).getTime()
        const dateB = new Date(b.fee_structure?.due_date || 0).getTime()
        return dateA - dateB
    })

    if (sortedFees && sortedFees.length > 0) {
        let remainingPayment = parseFloat(amount)

        for (const fee of sortedFees) {
            if (remainingPayment <= 0) break

            const due = fee.amount_due - (fee.amount_paid || 0)
            const payAmount = Math.min(remainingPayment, due)

            const newPaid = (fee.amount_paid || 0) + payAmount
            const newStatus = newPaid >= fee.amount_due ? 'paid' : 'partial'

            await supabase
                .from('student_fees')
                .update({
                    amount_paid: newPaid,
                    status: newStatus
                })
                .eq('id', fee.id)

            remainingPayment -= payAmount
        }
    }

    // Trigger Automation: FEE_PAID
    // Fetch student details for context
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
                class_id: student.classes?.name, // Use name for easier matching? Or ID. Let's use ID in rule builder but name here might be easier for "Class 10"
                section_id: student.sections?.name
            },
            fee: {
                amount_paid: parseFloat(amount),
                payment_mode: paymentMode,
                last_payment_date: new Date().toISOString()
            },
            phone: student.father_phone || student.mother_phone // For WhatsApp
        }

        // Run in background (don't await to block UI)
        checkAndRunAutomations('FEE_PAID', context).catch(console.error)
    }

    revalidatePath('/dashboard/fees/collect')
    return { message: 'Fee collected successfully', data: transaction }
}

export async function getStudentPendingFees(studentId: string) {
    const supabase = createClient()
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
    const supabase = createClient()

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
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const { error } = await supabase
        .from('fee_structures')
        .delete()
        .eq('id', id)

    if (error) return { error: error.message }

    revalidatePath('/dashboard/fees/structure')
    return { message: 'Fee structure deleted' }
}

export async function syncFeeStructure(structureId: string) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const { data: profile } = await supabase
        .from('user_profiles')
        .select('school_id')
        .eq('id', user.id)
        .single()

    if (!profile?.school_id) return { error: 'No school linked' }

    // 1. Get Fee Structure
    const { data: structure } = await supabase
        .from('fee_structures')
        .select('*')
        .eq('id', structureId)
        .single()

    if (!structure) return { error: 'Fee structure not found' }

    // 2. Get Students in Class
    const { data: students } = await supabase
        .from('students')
        .select('id')
        .eq('school_id', profile.school_id)
        .eq('current_class_id', structure.class_id)
        .eq('is_active', true)

    if (!students || students.length === 0) {
        return { message: 'No active students found in this class.' }
    }

    // 3. Assign Fee to Students (Avoid duplicates)
    let assignedCount = 0
    for (const student of students) {
        const { data: existingFee } = await supabase
            .from('student_fees')
            .select('id')
            .eq('student_id', student.id)
            .eq('fee_structure_id', structure.id)
            .single()

        if (!existingFee) {
            await supabase
                .from('student_fees')
                .insert({
                    school_id: profile.school_id,
                    student_id: student.id,
                    fee_structure_id: structure.id,
                    amount_due: structure.amount,
                    amount_paid: 0,
                    status: 'pending'
                })
            assignedCount++
        }
    }

    revalidatePath('/dashboard/fees/structure')
    return { message: `Synced: Assigned fee to ${assignedCount} new students.` }
}

export async function getFeeRecords(filters: any) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const { data: profile } = await supabase
        .from('user_profiles')
        .select('school_id')
        .eq('id', user.id)
        .single()

    if (!profile?.school_id) return { error: 'No school linked' }

    let query = supabase
        .from('student_fees')
        .select(`
            *,
            students!inner (
                first_name,
                last_name,
                admission_no,
                gender,
                classes!inner (id, name),
                sections (name)
            ),
            fee_structure:fee_structures!inner (
                amount,
                due_date,
                fee_head:fee_heads (name)
            )
        `)
        .eq('school_id', profile.school_id)

    if (filters.classId && filters.classId !== 'all') {
        query = query.eq('students.classes.id', filters.classId)
    }

    if (filters.status && filters.status !== 'all') {
        query = query.eq('status', filters.status)
    }

    // Date range filter on Due Date
    if (filters.startDate) {
        query = query.gte('fee_structure.due_date', filters.startDate)
    }
    if (filters.endDate) {
        query = query.lte('fee_structure.due_date', filters.endDate)
    }

    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) return { error: error.message }
    return { data }
}

export async function getFeeTransactions(filters: any) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const { data: profile } = await supabase
        .from('user_profiles')
        .select('school_id')
        .eq('id', user.id)
        .single()

    if (!profile?.school_id) return { error: 'No school linked' }

    let query = supabase
        .from('fee_transactions')
        .select(`
            *,
            students!inner (
                first_name,
                last_name,
                admission_no,
                classes!inner (id, name)
            )
        `)
        .eq('school_id', profile.school_id)

    if (filters.classId && filters.classId !== 'all') {
        query = query.eq('students.classes.id', filters.classId)
    }

    if (filters.paymentMode && filters.paymentMode !== 'all') {
        query = query.eq('payment_mode', filters.paymentMode)
    }

    if (filters.startDate) {
        query = query.gte('payment_date', filters.startDate)
    }
    if (filters.endDate) {
        query = query.lte('payment_date', filters.endDate)
    }

    const { data, error } = await query.order('payment_date', { ascending: false })

    if (error) return { error: error.message }
    return { data }
}
