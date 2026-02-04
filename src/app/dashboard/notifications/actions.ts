'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { sendWhatsAppMessage } from '@/lib/whatsapp'
import { sendEmail } from '@/lib/email'

export async function createNotification(formData: FormData) {
    const supabase = await createClient()
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

    const channels = formData.getAll('channels') as string[] // Get selected channels

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
            status: 'Pending',
            created_by: user.id,
            channels: channels.length > 0 ? channels : ['App'] // Default to App if none selected (though UI should enforce)
        })
        .select()
        .single()

    if (notifError) {
        console.error('Error creating notification:', notifError)
        return { error: 'Failed to create notification record: ' + notifError.message }
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

    // 3. Trigger Sending Process
    // For MVP, we process immediately. In prod, use a queue.

    let successCount = 0
    let failCount = 0

    if (recipientGroup === 'Student') {
        // Fetch phone numbers and emails
        const { data: students } = await supabase
            .from('students')
            .select('id, father_phone, first_name, email')
            .in('id', recipients)

        if (students) {
            const templateName = 'school_notification'

            for (const student of students) {
                let success = false
                let errorMsg = ''

                // 1. WhatsApp
                if (channels.includes('WhatsApp') && student.father_phone) {
                    let phone = student.father_phone.replace(/\D/g, '')
                    if (phone.length === 10) phone = '91' + phone

                    const components = [
                        {
                            type: 'body',
                            parameters: [
                                {
                                    type: 'text',
                                    text: message // The custom message from the form
                                }
                            ]
                        }
                    ]

                    const result = await sendWhatsAppMessage(phone, templateName, 'en_US', components)
                    if (result.success) success = true
                    else errorMsg += `WhatsApp: ${result.error}; `
                }

                // 2. Email
                if (channels.includes('Email') && student.email) {
                    const emailSubject = title
                    const emailHtml = `<p>${message}</p><br/><p>Regards,<br/>School Admin</p>`

                    const result = await sendEmail(student.email, emailSubject, emailHtml)
                    if (result.success) success = true
                    else errorMsg += `Email: ${result.error}; `
                }

                // 3. SMS (Mock)
                if (channels.includes('SMS') && student.father_phone) {
                    // await sendSMS(...)
                    // Mock success for now
                    success = true
                }

                // 4. App (Always sent if selected, just DB record update)
                if (channels.includes('App')) {
                    success = true
                }

                // Update status
                await supabase
                    .from('notification_recipients')
                    .update({
                        status: success ? 'Sent' : 'Failed',
                        error_message: errorMsg || (success ? null : 'No valid channel or failed to send')
                    })
                    .eq('notification_id', notification.id)
                    .eq('recipient_id', student.id)

                if (success) successCount++
                else failCount++
            }
        }
    }

    // Update main notification status
    await supabase
        .from('notifications')
        .update({
            status: failCount === 0 ? 'Sent' : 'Failed', // 'Partial' is not in DB constraint
            sent_at: new Date().toISOString()
        })
        .eq('id', notification.id)

    revalidatePath('/dashboard/notifications')
    return { success: true, message: `Processed: ${successCount} sent, ${failCount} failed.` }
}

