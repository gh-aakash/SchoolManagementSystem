import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { gatewayFetch } from '@/lib/gateway'

export async function createSubject(formData: FormData) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const { data: profile } = await supabase
        .from('user_profiles')
        .select('school_id')
        .eq('id', user.id)
        .single()

    if (!profile?.school_id) return { error: 'No school linked' }

    try {
        await gatewayFetch('/api/academic/subjects', {
            method: 'POST',
            body: JSON.stringify({
                school_id: profile.school_id,
                name: formData.get('name'),
                code: formData.get('code'),
                type: formData.get('type')
            })
        })
        revalidatePath('/dashboard/academics/subjects')
        return { success: true }
    } catch (error: any) {
        return { error: error.message }
    }
}

export async function createExam(formData: FormData) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const { data: profile } = await supabase
        .from('user_profiles')
        .select('school_id')
        .eq('id', user.id)
        .single()

    if (!profile?.school_id) return { error: 'No school linked' }

    try {
        const activeYear = await gatewayFetch(`/api/identity/academic-years/active?school_id=${profile.school_id}`)

        await gatewayFetch('/api/academic/exams', {
            method: 'POST',
            body: JSON.stringify({
                school_id: profile.school_id,
                academic_year_id: activeYear.id,
                name: formData.get('name'),
                start_date: formData.get('start_date') || null,
                end_date: formData.get('end_date') || null
            })
        })
        revalidatePath('/dashboard/academics/exams')
        return { success: true }
    } catch (error: any) {
        return { error: error.message }
    }
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

    try {
        await gatewayFetch('/api/academic/exam-results/upsert', {
            method: 'POST',
            body: JSON.stringify({ updates })
        })
        return { success: true }
    } catch (error: any) {
        return { error: error.message }
    }
}
