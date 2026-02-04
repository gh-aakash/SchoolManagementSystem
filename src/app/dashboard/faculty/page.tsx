
import { createClient } from '@/lib/supabase/server'
import { gatewayFetch } from '@/lib/gateway'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { StaffList } from './teachers-list'
import { AddStaffDialog } from './add-teacher-dialog'

export default async function FacultyPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data: profile } = await supabase
        .from('user_profiles')
        .select('school_id')
        .eq('id', user.id)
        .single()

    if (!profile?.school_id) return <div>No school linked</div>

    let staff = []
    try {
        staff = await gatewayFetch(`/api/identity/staff?school_id=${profile.school_id}`)
    } catch (error) {
        console.error('Fetch Staff Error:', error)
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-2xl font-bold tracking-tight">Staff Management</h3>
                    <p className="text-muted-foreground">
                        Manage teachers, administrators, and support staff.
                    </p>
                </div>
                <AddStaffDialog />
            </div>

            <StaffList staff={staff || []} />
        </div>
    )
}
