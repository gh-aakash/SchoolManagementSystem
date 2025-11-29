
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { MarkAttendanceForm } from './mark-attendance-form'
import { redirect } from 'next/navigation'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { MasterAttendanceView } from './master-view'

export default async function AttendancePage() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: profile } = await supabase
        .from('user_profiles')
        .select('school_id')
        .eq('id', user.id)
        .single()

    if (!profile?.school_id) return <div>No school linked</div>

    // Fetch Classes
    const { data: classes } = await supabase
        .from('classes')
        .select('id, name, sections(id, name)')
        .eq('school_id', profile.school_id)
        .order('order_index')

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold tracking-tight">Attendance Management</h1>
            </div>

            <Tabs defaultValue="mark" className="w-full">
                <TabsList>
                    <TabsTrigger value="mark">Mark Attendance</TabsTrigger>
                    <TabsTrigger value="master">Master View</TabsTrigger>
                </TabsList>

                <TabsContent value="mark" className="mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Mark Attendance</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <MarkAttendanceForm classes={classes || []} />
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="master" className="mt-4">
                    <MasterAttendanceView classes={classes || []} />
                </TabsContent>
            </Tabs>
        </div>
    )
}
