
import { createClient } from '@/lib/supabase/server'
import { FeeReminderForm } from './fee-reminder-form'

export default async function FeeRemindersPage() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return null

    const { data: profile } = await supabase
        .from('user_profiles')
        .select('school_id')
        .eq('id', user.id)
        .single()

    if (!profile?.school_id) return <div>No school linked</div>

    // Fetch Classes
    const { data: classes } = await supabase
        .from('classes')
        .select('id, name')
        .eq('school_id', profile.school_id)
        .order('order_index')

    // Fetch Templates (Type: Fee Reminder)
    const { data: templates } = await supabase
        .from('notification_templates')
        .select('*')
        .eq('school_id', profile.school_id)
        .eq('type', 'Fee Reminder')
        .order('name')

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-2xl font-bold tracking-tight">Fee Reminders</h3>
                <p className="text-muted-foreground">
                    Send automated fee reminders to students with pending dues.
                </p>
            </div>

            <FeeReminderForm
                classes={classes || []}
                templates={templates || []}
            />
        </div>
    )
}
