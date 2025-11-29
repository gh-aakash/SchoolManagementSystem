
import { createClient } from '@/lib/supabase/server'
import { SchoolProfile } from './school-profile'
import { AcademicYears } from './academic-years'
import { Separator } from '@/components/ui/separator'

export default async function SettingsPage() {
    const supabase = createClient()

    const { data: { user } } = await supabase.auth.getUser()
    console.log('Settings Page - User:', user?.id)
    if (!user) return null

    // Get user's school_id
    const { data: profile } = await supabase
        .from('user_profiles')
        .select('school_id')
        .eq('id', user.id)
        .single()

    if (!profile?.school_id) {
        console.log('Settings Page - No School ID for profile:', profile)
        return <div>No school linked to this account.</div>
    }
    console.log('Settings Page - School ID:', profile.school_id)

    // Fetch school details
    const { data: school } = await supabase
        .from('schools')
        .select('*')
        .eq('id', profile.school_id)
        .single()

    // Fetch academic years
    const { data: years } = await supabase
        .from('academic_years')
        .select('*')
        .eq('school_id', profile.school_id)
        .order('start_date', { ascending: false })

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-medium">Settings</h3>
                <p className="text-sm text-muted-foreground">
                    Manage your school settings and preferences.
                </p>
            </div>
            <Separator />
            <SchoolProfile school={school} />
            <AcademicYears years={years || []} />
        </div>
    )
}
