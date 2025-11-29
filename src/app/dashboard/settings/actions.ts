
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateSchoolProfile(formData: FormData) {
    const supabase = createClient()

    const name = formData.get('name') as string
    const address = formData.get('address') as string
    const phone = formData.get('phone') as string
    const email = formData.get('email') as string
    const website = formData.get('website') as string
    const affiliation_no = formData.get('affiliation_no') as string
    const board = formData.get('board') as string

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    // Get user's school_id
    const { data: profile } = await supabase
        .from('user_profiles')
        .select('school_id')
        .eq('id', user.id)
        .single()

    if (!profile?.school_id) return { error: 'No school linked to user' }

    const { error } = await supabase
        .from('schools')
        .update({
            name,
            address,
            phone,
            email,
            website,
            affiliation_no,
            board
        })
        .eq('id', profile.school_id)

    if (error) return { error: error.message }

    revalidatePath('/dashboard/settings')
    return { success: true }
}
