
import { createClient } from '@/lib/supabase/server'
import { AdmissionForm } from './admission-form'

export default async function AddStudentPage() {
    const supabase = await createClient()
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
        .select('*')
        .eq('school_id', profile.school_id)
        .order('order_index')

    // Fetch Sections
    const { data: sections } = await supabase
        .from('sections')
        .select('*')
        .eq('school_id', profile.school_id)
        .order('name')

    return (
        <div className="max-w-4xl mx-auto">
            <AdmissionForm classes={classes || []} sections={sections || []} />
        </div>
    )
}
