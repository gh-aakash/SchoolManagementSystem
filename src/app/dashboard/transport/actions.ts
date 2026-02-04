
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createRoute(formData: FormData) {
    const supabase = await createClient()
    const route_name = formData.get('route_name') as string
    const vehicle_number = formData.get('vehicle_number') as string
    const driver_name = formData.get('driver_name') as string
    const driver_phone = formData.get('driver_phone') as string

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const { data: profile } = await supabase
        .from('user_profiles')
        .select('school_id')
        .eq('id', user.id)
        .single()

    if (!profile?.school_id) return { error: 'No school linked' }

    const { error } = await supabase
        .from('transport_routes')
        .insert({
            school_id: profile.school_id,
            route_name,
            vehicle_number,
            driver_name,
            driver_phone
        })

    if (error) return { error: error.message }

    revalidatePath('/dashboard/transport/routes')
    return { success: true }
}

export async function createStop(formData: FormData) {
    const supabase = await createClient()
    const route_id = formData.get('route_id') as string
    const stop_name = formData.get('stop_name') as string
    const pickup_time = formData.get('pickup_time') as string
    const drop_time = formData.get('drop_time') as string
    const monthly_fee = formData.get('monthly_fee') as string

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const { data: profile } = await supabase
        .from('user_profiles')
        .select('school_id')
        .eq('id', user.id)
        .single()

    if (!profile?.school_id) return { error: 'No school linked' }

    const { error } = await supabase
        .from('transport_stops')
        .insert({
            school_id: profile.school_id,
            route_id,
            stop_name,
            pickup_time: pickup_time || null,
            drop_time: drop_time || null,
            monthly_fee: Number(monthly_fee)
        })

    if (error) return { error: error.message }

    revalidatePath('/dashboard/transport/stops')
    return { success: true }
}
