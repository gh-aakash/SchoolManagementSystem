
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

export async function syncClasses() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const { data: profile } = await supabase
        .from('user_profiles')
        .select('school_id')
        .eq('id', user.id)
        .single()

    if (!profile?.school_id) return { error: 'No school linked' }

    // Check and create classes 11 and 12
    for (let i = 11; i <= 12; i++) {
        const className = `Class ${i}`

        const { data: existing } = await supabase
            .from('classes')
            .select('id')
            .eq('school_id', profile.school_id)
            .eq('name', className)
            .single()

        if (!existing) {
            const { data: newClass, error } = await supabase
                .from('classes')
                .insert({
                    school_id: profile.school_id,
                    name: className,
                    order_index: i
                })
                .select()
                .single()

            if (error) {
                console.error('Error creating class:', error)
            } else {
                // Create Section A
                await supabase.from('sections').insert({
                    school_id: profile.school_id,
                    class_id: newClass.id,
                    name: 'A'
                })
            }
        }
    }

    revalidatePath('/dashboard', 'layout')
    return { success: true, message: 'Classes synced successfully' }
}
