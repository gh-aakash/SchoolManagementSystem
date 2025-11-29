
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createAcademicYear(formData: FormData) {
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

    const { error } = await supabase
        .from('academic_years')
        .insert({
            school_id: profile.school_id,
            name,
            start_date,
            end_date,
            is_active: false // Default to false
        })

    if (error) return { error: error.message }

    revalidatePath('/dashboard/settings')
    return { success: true }
}

export async function setAcademicYearActive(id: string) {
    const supabase = createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const { data: profile } = await supabase
        .from('user_profiles')
        .select('school_id')
        .eq('id', user.id)
        .single()

    if (!profile?.school_id) return { error: 'No school linked' }

    // 1. Deactivate all for this school
    await supabase
        .from('academic_years')
        .update({ is_active: false })
        .eq('school_id', profile.school_id)

    // 2. Activate the selected one
    const { error } = await supabase
        .from('academic_years')
        .update({ is_active: true })
        .eq('id', id)
        .eq('school_id', profile.school_id)

    if (error) return { error: error.message }

    revalidatePath('/dashboard/settings')
    return { success: true }
}
