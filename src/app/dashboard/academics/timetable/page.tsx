import { createClient } from '@/lib/supabase/server'
import { TimetableBuilder } from './timetable-builder'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { MasterView } from './master-view'

export default async function TimetablePage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data: profile } = await supabase
        .from('user_profiles')
        .select('school_id')
        .eq('id', user.id)
        .single()

    if (!profile?.school_id) return null

    // Fetch Initial Data
    const { data: classes } = await supabase
        .from('classes')
        .select('*, sections(*)')
        .eq('school_id', profile.school_id)
        .order('name')

    const { data: periods } = await supabase
        .from('class_periods')
        .select('*')
        .eq('school_id', profile.school_id)
        .order('order_index')

    const { data: subjects } = await supabase
        .from('subjects')
        .select('*')
        .eq('school_id', profile.school_id)
        .order('name')

    const { data: teachers } = await supabase
        .from('staff')
        .select('*')
        .eq('school_id', profile.school_id)
        .eq('is_active', true)
        .order('first_name')

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold tracking-tight">Timetable Management</h1>
            </div>

            <Tabs defaultValue="manage" className="w-full">
                <TabsList>
                    <TabsTrigger value="manage">Manage Timetable</TabsTrigger>
                    <TabsTrigger value="master">Master View</TabsTrigger>
                </TabsList>

                <TabsContent value="manage" className="mt-4">
                    <TimetableBuilder
                        classes={classes || []}
                        initialPeriods={periods || []}
                        subjects={subjects || []}
                        teachers={teachers || []}
                    />
                </TabsContent>

                <TabsContent value="master" className="mt-4">
                    <MasterView
                        classes={classes || []}
                        periods={periods || []}
                        teachers={teachers || []}
                    />
                </TabsContent>
            </Tabs>
        </div>
    )
}
