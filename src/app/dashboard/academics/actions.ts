
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createSubject(formData: FormData) {
    const supabase = createClient()
    const name = formData.get('name') as string
    const code = formData.get('code') as string
    const type = formData.get('type') as string

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const { data: profile } = await supabase
        .from('user_profiles')
        .select('school_id')
        .eq('id', user.id)
        .single()

    if (!profile?.school_id) return { error: 'No school linked' }

    const { error } = await supabase
        .from('subjects')
        .insert({
            school_id: profile.school_id,
            name,
            code,
            type
        })

    if (error) return { error: error.message }

    revalidatePath('/dashboard/academics/subjects')
    return { success: true }
}

export async function createExam(formData: FormData) {
    const supabase = createClient()
    const name = formData.get('name') as string
    const start_date = formData.get('start_date') as string
    const end_date = formData.get('end_date') as string

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const { data: profile } = await supabase
        .from('user_profiles')
        .select('school_id')
        .eq('id', user.id)
        .single()

    if (!profile?.school_id) return { error: 'No school linked' }

    // Get active academic year
    const { data: activeYear } = await supabase
        .from('academic_years')
        .select('id')
        .eq('school_id', profile.school_id)
        .eq('is_active', true)
        .single()

    if (!activeYear) return { error: 'No active academic year found' }

    const { error } = await supabase
        .from('exams')
        .insert({
            school_id: profile.school_id,
            academic_year_id: activeYear.id,
            name,
            start_date: start_date || null,
            end_date: end_date || null
        })

    if (error) return { error: error.message }

    revalidatePath('/dashboard/academics/exams')
    return { success: true }
}

export async function updateMarks(data: { student_id: string, exam_id: string, subject_id: string, marks: number }[]) {
    const supabase = createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const { data: profile } = await supabase
        .from('user_profiles')
        .select('school_id')
        .eq('id', user.id)
        .single()

    if (!profile?.school_id) return { error: 'No school linked' }

    const updates = data.map(d => ({
        school_id: profile.school_id,
        student_id: d.student_id,
        exam_id: d.exam_id,
        subject_id: d.subject_id,
        marks_obtained: d.marks
    }))

    const { error } = await supabase
        .from('exam_results')
        .upsert(updates, { onConflict: 'student_id, exam_id, subject_id' })

    if (error) return { error: error.message }

    return { success: true }
}
