
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AttendanceCharts } from './attendance-charts'
import { ExportButton } from './export-button'

export default async function AnalyticsPage() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data: profile } = await supabase
        .from('user_profiles')
        .select('school_id')
        .eq('id', user.id)
        .single()

    if (!profile?.school_id) return <div>No school linked</div>

    // Fetch Attendance Data for Analytics
    // We'll fetch last 30 days for now
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const { data: attendance } = await supabase
        .from('attendance')
        .select('date, status')
        .eq('school_id', profile.school_id)
        .gte('date', thirtyDaysAgo.toISOString())
        .order('date')

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-2xl font-bold tracking-tight">Attendance Analytics</h3>
                    <p className="text-muted-foreground">
                        Insights into student attendance trends.
                    </p>
                </div>
                <ExportButton />
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Present (30d)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {attendance?.filter(a => a.status === 'Present').length || 0}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Absent (30d)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {attendance?.filter(a => a.status === 'Absent').length || 0}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <AttendanceCharts data={attendance || []} />
        </div>
    )
}
