
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createStudent(formData: FormData) {
    const supabase = createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const { data: profile } = await supabase
        .from('user_profiles')
        .select('school_id')
        .eq('id', user.id)
        .single()

    if (!profile?.school_id) return { error: 'No school linked' }

    // Auto-generate Admission Number
    // 1. Get the last student's admission number
    const { data: lastStudent } = await supabase
        .from('students')
        .select('admission_no')
        .eq('school_id', profile.school_id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

    let nextAdmissionNo = 'ADM-00001'
    if (lastStudent?.admission_no) {
        // Extract number part (assuming format ADM-XXXXX)
        const match = lastStudent.admission_no.match(/ADM-(\d+)/)
        if (match) {
            const nextNum = parseInt(match[1]) + 1
            nextAdmissionNo = `ADM-${nextNum.toString().padStart(5, '0')}`
        }
    }

    const studentData: any = {
        school_id: profile.school_id,
        first_name: formData.get('first_name'),
        email: formData.get('email'),
        last_name: formData.get('last_name'),
        gender: formData.get('gender'),
        dob: formData.get('dob'),
        blood_group: formData.get('blood_group'),
        religion: formData.get('religion'),
        caste_category: formData.get('caste_category'),
        aadhar_no: formData.get('aadhar_no'),
        father_name: formData.get('father_name'),
        mother_name: formData.get('mother_name'),
        father_phone: formData.get('father_phone'),
        mother_phone: formData.get('mother_phone'),
        annual_income: formData.get('annual_income') ? Number(formData.get('annual_income')) : null,
        address: formData.get('address'),
        city: formData.get('city'),
        state: formData.get('state'),
        pincode: formData.get('pincode'),
        current_class_id: formData.get('class_id'),
        current_section_id: formData.get('section_id'),
    }

    // Only add admission_no if creating new (handled later) or if we want to allow updating it (usually not)
    if (!formData.get('id')) {
        studentData.admission_no = nextAdmissionNo
    }

    // Only add URLs if they exist in formData (meaning a new upload happened)
    if (formData.get('photo_url')) studentData.photo_url = formData.get('photo_url')
    if (formData.get('tc_url')) studentData.tc_url = formData.get('tc_url')
    if (formData.get('birth_cert_url')) studentData.birth_cert_url = formData.get('birth_cert_url')

    // Check if ID exists for update
    const studentId = formData.get('id') as string

    // Get active academic year
    const { data: activeYear } = await supabase
        .from('academic_years')
        .select('id')
        .eq('school_id', profile.school_id)
        .eq('is_active', true)
        .single()

    if (!activeYear) return { error: 'No active academic year found. Please set one in Settings.' }

    let error;

    if (studentId) {
        // Update existing student
        // Remove admission_no from update data to prevent changing it
        const { admission_no, ...updateData } = studentData

        const result = await supabase
            .from('students')
            .update({
                ...updateData,
                // Only update photo/docs if new ones provided (handled by form logic sending empty if not new?)
                // Actually formData.get returns empty string if not present?
                // We should clean up null/undefined/empty strings if we don't want to overwrite with null
                // But our form sends the URL if uploaded. If not uploaded, it might send empty string or old URL?
                // The form logic sets 'photo_url' only if uploaded. 
                // If not uploaded, we should probably NOT include it in updateData if it's not in formData.
                // But formData.get returns null if not set.
            })
            .eq('id', studentId)
            .eq('school_id', profile.school_id)

        error = result.error
    } else {
        // Create new student
        const result = await supabase
            .from('students')
            .insert({
                ...studentData,
                academic_year_id: activeYear.id
            })
        error = result.error
    }

    if (error) return { error: error.message }

    revalidatePath('/dashboard/students')
    if (studentId) {
        revalidatePath(`/dashboard/students/${studentId}`)
        redirect(`/dashboard/students/${studentId}`)
    } else {
        redirect('/dashboard/students')
    }
}

export async function autoAllocateRollNumbers(classId: string, sectionId: string) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const { data: profile } = await supabase
        .from('user_profiles')
        .select('school_id')
        .eq('id', user.id)
        .single()

    if (!profile?.school_id) return { error: 'No school linked' }

    // Fetch students in class/section
    const { data: students } = await supabase
        .from('students')
        .select('id, first_name, last_name')
        .eq('school_id', profile.school_id)
        .eq('current_class_id', classId)
        .eq('current_section_id', sectionId)
        .order('first_name', { ascending: true })
        .order('last_name', { ascending: true })

    if (!students || students.length === 0) return { error: 'No students found in this section' }

    // Update roll numbers
    let count = 0
    for (let i = 0; i < students.length; i++) {
        const student = students[i]
        const rollNo = (i + 1).toString()
        const { error } = await supabase
            .from('students')
            .update({ roll_no: rollNo })
            .eq('id', student.id)

        if (!error) count++
    }

    revalidatePath('/dashboard/students')
    return { success: true, message: `Updated roll numbers for ${count} students` }
}
