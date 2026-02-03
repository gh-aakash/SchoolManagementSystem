import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { gatewayFetch } from '@/lib/gateway'

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

    try {
        const data = await gatewayFetch('/api/academic/periods', {
            method: 'POST',
            body: JSON.stringify({
                school_id: profile.school_id,
                name: formData.get('name'),
                start_time: formData.get('startTime'),
                end_time: formData.get('endTime')
            })
        })
        return { data }
    } catch (error: any) {
        return { error: error.message }
    }
}

export async function getTimetable(sectionId: string) {
    try {
        const data = await gatewayFetch(`/api/academic/timetable/${sectionId}`)
        return { data }
    } catch (error: any) {
        return { error: error.message }
    }
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

    try {
        await gatewayFetch('/api/academic/timetable/save', {
            method: 'POST',
            body: JSON.stringify({
                school_id: profile.school_id,
                section_id: sectionId,
                entries
            })
        })
        return { success: true }
    } catch (error: any) {
        return { error: error.message }
    }
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

    try {
        const data = await gatewayFetch(`/api/academic/timetable/master?school_id=${profile.school_id}&day_of_week=${day}`)
        return { data }
    } catch (error: any) {
        return { error: error.message }
    }
}
