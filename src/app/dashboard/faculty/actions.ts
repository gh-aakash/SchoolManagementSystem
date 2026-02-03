import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { gatewayFetch } from '@/lib/gateway'

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

    try {
        await gatewayFetch('/api/identity/staff', {
            method: 'POST',
            body: JSON.stringify({
                school_id: profile.school_id,
                first_name: firstName,
                last_name: lastName,
                email,
                phone,
                qualification,
                designation: designation || 'Teacher',
                joining_date: joiningDate || null
            })
        })

        revalidatePath('/dashboard/faculty')
        return { success: true }
    } catch (error: any) {
        console.error('Create Staff Error:', error)
        return { error: error.message }
    }
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

    try {
        await gatewayFetch(`/api/identity/staff/${id}`, {
            method: 'PUT',
            body: JSON.stringify({
                first_name: firstName,
                last_name: lastName,
                email,
                phone,
                qualification,
                designation,
                joining_date: joiningDate || null
            })
        })

        revalidatePath('/dashboard/faculty')
        revalidatePath(`/dashboard/faculty/${id}`)
        return { success: true }
    } catch (error: any) {
        return { error: error.message }
    }
}

export async function deleteStaff(id: string) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    try {
        await gatewayFetch(`/api/identity/staff/${id}`, {
            method: 'DELETE'
        })

        revalidatePath('/dashboard/faculty')
        return { success: true }
    } catch (error: any) {
        return { error: error.message }
    }
}
