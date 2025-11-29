
import { createClient } from '@/lib/supabase/server'
import { CreateNotificationForm } from './create-notification-form'

export default async function CreateNotificationPage() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return null

    const { data: profile } = await supabase
        .from('user_profiles')
        .select('school_id')
        .eq('id', user.id)
        .single()

    if (!profile?.school_id) return <div>No school linked</div>

    // Fetch Classes and Sections for Student Group Selection
    const { data: classes } = await supabase
        .from('classes')
        .select('id, name')
        .eq('school_id', profile.school_id)
        .order('order_index')

    const { data: sections } = await supabase
        .from('sections')
        .select('id, name, class_id')
        .eq('school_id', profile.school_id)
        .order('name')

    // Fetch All Students (Optimized: only needed fields)
    const { data: students } = await supabase
        .from('students')
        .select('id, first_name, last_name, admission_no, current_class_id, current_section_id')
        .eq('school_id', profile.school_id)
        .eq('is_active', true)
        .order('first_name')

    // Fetch Teachers (Mock for now as we might not have a teachers table yet, or use users with role 'Teacher')
    // Assuming we have a 'teachers' table or similar. If not, we'll skip or mock.
    // For now, let's assume we don't have a robust teacher list, so we'll pass an empty list or mock.
    const teachers: any[] = []

    // Fetch Drivers
    // const { data: drivers } = await supabase.from('drivers').select('*')...
    const drivers: any[] = []

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-2xl font-bold tracking-tight">Create Notification</h3>
                <p className="text-muted-foreground">
                    Send messages to students, teachers, or drivers.
                </p>
            </div>

            <CreateNotificationForm
                classes={classes || []}
                sections={sections || []}
                students={students || []}
                teachers={teachers}
                drivers={drivers}
            />
        </div>
    )
}
