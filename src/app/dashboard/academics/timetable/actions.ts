
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createPeriod(formData: FormData) {
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
    const startTime = formData.get('startTime') as string
    const endTime = formData.get('endTime') as string

    const { data, error } = await supabase
        .from('class_periods')
        .insert({
            school_id: profile.school_id,
            name,
            start_time: startTime,
            end_time: endTime
        })
        .select()
        .single()

    if (error) return { error: error.message }
    return { data }
}

export async function deletePeriod(id: string) {
    // Implementation for delete if needed
}

export async function getTimetable(sectionId: string) {
    const supabase = createClient()
    const { data, error } = await supabase
        .from('timetable')
        .select('*')
        .eq('section_id', sectionId)

    if (error) return { error: error.message }
    return { data }
}

export async function saveTimetable(sectionId: string, entries: any[]) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const { data: profile } = await supabase
        .from('user_profiles')
        .select('school_id')
        .eq('id', user.id)
        .single()

    if (!profile?.school_id) return { error: 'No school linked' }

    // Check for conflicts
    for (const entry of entries) {
        if (!entry.teacher_id) continue;

        const { data: conflict } = await supabase
            .from('timetable')
            .select('classes(name), sections(name)')
            .eq('school_id', profile.school_id)
            .eq('day_of_week', entry.day_of_week)
            .eq('period_id', entry.period_id)
            .eq('teacher_id', entry.teacher_id)
            .neq('section_id', sectionId) // Conflict if in another section
            .single()

        if (conflict) {
            return {
                error: `Conflict: Teacher is already assigned to ${conflict.classes?.name} - ${conflict.sections?.name} at this time.`
            }
        }
    }

    // Clean entries
    const upsertData = entries.map(e => ({
        school_id: profile.school_id,
        class_id: e.class_id,
        section_id: sectionId,
        day_of_week: e.day_of_week,
        period_id: e.period_id,
        subject_id: e.subject_id || null,
        teacher_id: e.teacher_id || null
    }))

    const { error } = await supabase
        .from('timetable')
        .upsert(upsertData, { onConflict: 'section_id, day_of_week, period_id' })

    if (error) return { error: error.message }
    return { success: true }
}

export async function getMasterTimetable(day: number) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const { data: profile } = await supabase
        .from('user_profiles')
        .select('school_id')
        .eq('id', user.id)
        .single()

    if (!profile?.school_id) return { error: 'No school linked' }

    const { data, error } = await supabase
        .from('timetable')
        .select(`
            *,
            classes(name),
            sections(name),
            subjects(name),
            staff(first_name, last_name)
        `)
        .eq('school_id', profile.school_id)
        .eq('day_of_week', day)

    if (error) return { error: error.message }
    return { data }
}
