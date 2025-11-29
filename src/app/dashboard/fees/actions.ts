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

    const classIds = formData.getAll('class_ids') as string[]
    const feeHeadId = formData.get('fee_head_id') as string
    const amount = formData.get('amount') as string
    const dueDate = formData.get('due_date') as string

    if (classIds.length === 0 || !feeHeadId || !amount || !dueDate) {
        return { error: 'Please select at least one class and fill all fields' }
    }

    // Get Active Academic Year
    const { data: activeYear } = await supabase
        .from('academic_years')
        .select('id')
        .eq('school_id', profile.school_id)
        .eq('is_active', true)
        .single()

    if (!activeYear) return { error: 'No active academic year found' }

    const feeStructures = classIds.map(classId => ({
        school_id: profile.school_id,
        class_id: classId,
        fee_head_id: feeHeadId,
        academic_year_id: activeYear.id,
        amount: parseFloat(amount),
        due_date: dueDate
    }))

    const { error } = await supabase
        .from('fee_structures')
        .insert(feeStructures)

    if (error) return { error: error.message }

    revalidatePath('/dashboard/fees/structure')
    return { message: `Fee Structure created for ${classIds.length} classes` }
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
    // 1. Get all fees for this student
    const { data: studentFees } = await supabase
        .from('student_fees')
        .select('*')
        .eq('student_id', studentId)
        .eq('status', 'pending') // Or partial
        .order('created_at', { ascending: true })

    if (studentFees && studentFees.length > 0) {
        let remainingPayment = parseFloat(amount)

        for (const fee of studentFees) {
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
