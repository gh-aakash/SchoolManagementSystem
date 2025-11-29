
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

    const studentData = {
        school_id: profile.school_id,
        admission_no: nextAdmissionNo,
        first_name: formData.get('first_name'),
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
        photo_url: formData.get('photo_url'),
        tc_url: formData.get('tc_url'),
        birth_cert_url: formData.get('birth_cert_url'),
        // academic_year_id: ... (Should fetch active year)
    }

    // Get active academic year
    const { data: activeYear } = await supabase
        .from('academic_years')
        .select('id')
        .eq('school_id', profile.school_id)
        .eq('is_active', true)
        .single()

    if (!activeYear) return { error: 'No active academic year found. Please set one in Settings.' }

    const { error } = await supabase
        .from('students')
        .insert({
            ...studentData,
            academic_year_id: activeYear.id
        })

    if (error) return { error: error.message }

    revalidatePath('/dashboard/students')
    redirect('/dashboard/students')
}
