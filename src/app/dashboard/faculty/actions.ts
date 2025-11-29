
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createStaff(formData: FormData) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const { data: profile } = await supabase
        .from('user_profiles')
        .select('school_id')
        .eq('id', user.id)
        .single()

    if (!profile?.school_id) return { error: 'No school linked' }

    const firstName = formData.get('firstName') as string
    const lastName = formData.get('lastName') as string
    const email = formData.get('email') as string
    const phone = formData.get('phone') as string
    const qualification = formData.get('qualification') as string
    const designation = formData.get('designation') as string
    const joiningDate = formData.get('joiningDate') as string

    if (!firstName) return { error: 'First Name is required' }

    const { error } = await supabase
        .from('staff')
        .insert({
            school_id: profile.school_id,
            first_name: firstName,
            last_name: lastName,
            email,
            phone,
            qualification,
            designation: designation || 'Teacher',
            joining_date: joiningDate || null
        })

    if (error) {
        console.error('Create Staff Error:', error)
        return { error: error.message }
    }

    revalidatePath('/dashboard/faculty')
    return { success: true }
}

export async function updateStaff(formData: FormData) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const id = formData.get('id') as string
    const firstName = formData.get('firstName') as string
    const lastName = formData.get('lastName') as string
    const email = formData.get('email') as string
    const phone = formData.get('phone') as string
    const qualification = formData.get('qualification') as string
    const designation = formData.get('designation') as string
    const joiningDate = formData.get('joiningDate') as string

    const { error } = await supabase
        .from('staff')
        .update({
            first_name: firstName,
            last_name: lastName,
            email,
            phone,
            qualification,
            designation,
            joining_date: joiningDate || null
        })
        .eq('id', id)

    if (error) return { error: error.message }
    revalidatePath('/dashboard/faculty')
    revalidatePath(`/dashboard/faculty/${id}`)
    return { success: true }
}

export async function deleteStaff(id: string) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const { error } = await supabase
        .from('staff')
        .delete()
        .eq('id', id)

    if (error) return { error: error.message }
    revalidatePath('/dashboard/faculty')
    return { success: true }
}
