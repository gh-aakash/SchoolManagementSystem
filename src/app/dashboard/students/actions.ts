'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { gatewayFetch } from '@/lib/gateway'

export async function createStudent(formData: FormData) {
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

    const studentId = formData.get('id') as string

    try {
        // Prepare student data
        const studentData: any = {
            school_id: schoolId,
            first_name: formData.get('first_name'),
            last_name: formData.get('last_name'),
            email: formData.get('email'),
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

        if (formData.get('photo_url')) studentData.photo_url = formData.get('photo_url')
        if (formData.get('tc_url')) studentData.tc_url = formData.get('tc_url')
        if (formData.get('birth_cert_url')) studentData.birth_cert_url = formData.get('birth_cert_url')

        if (studentId) {
            // Update
            await gatewayFetch(`/api/sis/students/${studentId}`, {
                method: 'PUT',
                body: JSON.stringify(studentData)
            })
        } else {
            // Create
            // 1. Get active academic year from Identity service (Essential for linking)
            const activeYear = await gatewayFetch(`/api/identity/academic-years/active?school_id=${schoolId}`)

            // 2. SIS service will now handle admission_no internally if not provided
            await gatewayFetch('/api/sis/students', {
                method: 'POST',
                body: JSON.stringify({
                    ...studentData,
                    academic_year_id: activeYear.id
                })
            })
        }

        revalidatePath('/dashboard/students')
        if (studentId) {
            revalidatePath(`/dashboard/students/${studentId}`)
            redirect(`/dashboard/students/${studentId}`)
        } else {
            redirect('/dashboard/students')
        }
    } catch (error: any) {
        console.error('Create/Update Student Error:', error)
        return { error: error.message }
    }
}

export async function autoAllocateRollNumbers(classId: string, sectionId: string) {
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
        // Fetch students via SIS service
        const students = await gatewayFetch(`/api/sis/students?school_id=${profile.school_id}&class_id=${classId}&section_id=${sectionId}`)

        // This logic is better handled inside the SIS service to avoid multiple roundtrips
        // But for now, I'll just refactor the fetch
        // TODO: Move fully into SIS service
        let count = 0
        for (let i = 0; i < students.length; i++) {
            const student = students[i]
            const rollNo = (i + 1).toString()
            await gatewayFetch(`/api/sis/students/${student.id}`, {
                method: 'PUT',
                body: JSON.stringify({ roll_no: rollNo })
            })
            count++
        }

        revalidatePath('/dashboard/students')
        return { success: true, message: `Updated roll numbers for ${count} students` }
    } catch (error: any) {
        return { error: error.message }
    }
}
