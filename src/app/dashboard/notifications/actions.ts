'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createNotification(formData: FormData) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'Unauthorized' }
    }

    const { data: profile } = await supabase
        .from('user_profiles')
        .select('school_id')
        .eq('id', user.id)
        .single()

    if (!profile?.school_id) {
        return { error: 'No school linked to user' }
    }

    const title = formData.get('title') as string
    const message = formData.get('message') as string
    const type = formData.get('type') as string
    const recipientGroup = formData.get('recipient_group') as string
    // recipients is a JSON string of IDs
    const recipientsJson = formData.get('recipients') as string
    const recipients = JSON.parse(recipientsJson || '[]')

    if (!title || !message || !type || recipients.length === 0) {
        return { error: 'Please fill all required fields and select at least one recipient.' }
    }

    // 1. Create Notification Record
    const { data: notification, error: notifError } = await supabase
        .from('notifications')
        .insert({
            school_id: profile.school_id,
            title,
            message,
            type,
            status: 'Pending', // Or 'Sent' if we process immediately
            created_by: user.id
        })
        .select()
        .single()

    if (notifError) {
        console.error('Error creating notification:', notifError)
        return { error: 'Failed to create notification record.' }
    }

    // 2. Create Recipient Records
    const recipientRecords = recipients.map((recipientId: string) => ({
        notification_id: notification.id,
        recipient_type: recipientGroup, // 'Student', 'Teacher', etc.
        recipient_id: recipientId,
        status: 'Pending'
    }))

    const { error: recipientError } = await supabase
        .from('notification_recipients')
        .insert(recipientRecords)

    if (recipientError) {
        console.error('Error adding recipients:', recipientError)
        // Ideally we should rollback the notification creation here, but Supabase doesn't support transactions in client lib easily without RPC.
        // For now, we'll just report error.
        return { error: 'Failed to add recipients.' }
    }

    // 3. Trigger Sending Process (Mock for now, or call an Edge Function)
    // In a real app, this would push to a queue. 
    // For this MVP, we'll just mark them as 'Sent' to simulate success.
    await supabase
        .from('notifications')
        .update({ status: 'Sent', sent_at: new Date().toISOString() })
        .eq('id', notification.id)

    revalidatePath('/dashboard/notifications')
    return { success: true }
}
