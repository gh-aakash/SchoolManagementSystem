import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Mail, Phone, MapPin, Calendar, Briefcase, User, Clock } from 'lucide-react'
import { format } from 'date-fns'
import { EditStaffDialog } from '../edit-staff-dialog'

export default async function StaffProfilePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data: staff } = await supabase
        .from('staff')
        .select('*')
        .eq('id', id)
        .single()

    if (!staff) notFound()

    return (
        <div className="space-y-6">
            {/* Header / Basic Info */}
            <div className="flex flex-col md:flex-row gap-6 items-start">
                <Avatar className="w-32 h-32 border-4 border-background shadow-lg">
                    <AvatarImage src={staff.photo_url || ''} />
                    <AvatarFallback className="text-4xl">{staff.first_name[0]}</AvatarFallback>
                </Avatar>

                <div className="space-y-2 flex-1">
                    <div className="flex justify-between items-start">
                        <div>
                            <h1 className="text-3xl font-bold">{staff.first_name} {staff.last_name}</h1>
                            <div className="flex items-center gap-2 mt-2">
                                <Badge variant="secondary" className="text-sm px-3 py-1">
                                    {staff.designation || 'Staff'}
                                </Badge>
                                <Badge variant={staff.is_active ? 'default' : 'destructive'} className="text-sm px-3 py-1">
                                    {staff.is_active ? 'Active' : 'Inactive'}
                                </Badge>
                            </div>
                        </div>
                        <EditStaffDialog staff={staff} />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4" />
                            {staff.email || 'No email provided'}
                        </div>
                        <div className="flex items-center gap-2">
                            <Phone className="w-4 h-4" />
                            {staff.phone || 'No phone provided'}
                        </div>
                        <div className="flex items-center gap-2">
                            <Briefcase className="w-4 h-4" />
                            {staff.qualification || 'No qualification listed'}
                        </div>
                        <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            Joined: {staff.joining_date ? format(new Date(staff.joining_date), 'PPP') : 'N/A'}
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs for Details & Timetable */}
            <Tabs defaultValue="timetable" className="w-full">
                <TabsList>
                    <TabsTrigger value="timetable">Timetable</TabsTrigger>
                    <TabsTrigger value="documents">Documents</TabsTrigger>
                    <TabsTrigger value="history">History</TabsTrigger>
                </TabsList>

                <TabsContent value="timetable" className="mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Clock className="w-5 h-5" />
                                Weekly Schedule
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <StaffTimetable staffId={id} schoolId={staff.school_id} />
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="documents" className="mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Staff Documents</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground">No documents uploaded.</p>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}

async function StaffTimetable({ staffId, schoolId }: { staffId: string, schoolId: string }) {
    const supabase = await createClient()

    // Fetch Periods
    const { data: periods } = await supabase
        .from('class_periods')
        .select('*')
        .eq('school_id', schoolId)
        .order('order_index')

    // Fetch Timetable Entries for this teacher
    const { data: entries } = await supabase
        .from('timetable')
        .select(`
            *,
            classes(name),
            sections(name),
            subjects(name)
        `)
        .eq('school_id', schoolId)
        .eq('teacher_id', staffId)

    if (!periods || periods.length === 0) {
        return <div className="text-center py-8 text-muted-foreground">No class periods defined.</div>
    }

    const DAYS = [
        { value: 1, label: 'Monday' },
        { value: 2, label: 'Tuesday' },
        { value: 3, label: 'Wednesday' },
        { value: 4, label: 'Thursday' },
        { value: 5, label: 'Friday' },
        { value: 6, label: 'Saturday' },
        { value: 7, label: 'Sunday' },
    ]

    // Helper to find entry
    const getEntry = (day: number, periodId: string) => {
        return entries?.find(e => e.day_of_week === day && e.period_id === periodId)
    }

    return (
        <div className="overflow-x-auto">
            <table className="w-full border-collapse min-w-[800px]">
                <thead>
                    <tr>
                        <th className="border p-2 bg-muted text-left w-32">Period</th>
                        {DAYS.map(day => (
                            <th key={day.value} className="border p-2 bg-muted text-center">{day.label}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {periods.map(period => (
                        <tr key={period.id}>
                            <td className="border p-2 font-medium">
                                <div>{period.name}</div>
                                <div className="text-xs text-muted-foreground">{period.start_time} - {period.end_time}</div>
                            </td>
                            {DAYS.map(day => {
                                const entry = getEntry(day.value, period.id)
                                return (
                                    <td key={day.value} className="border p-2 text-center h-16">
                                        {entry ? (
                                            <div className="bg-primary/10 p-1 rounded text-sm">
                                                <div className="font-semibold text-primary">{entry.subjects?.name}</div>
                                                <div className="text-xs text-muted-foreground">
                                                    {entry.classes?.name} - {entry.sections?.name}
                                                </div>
                                            </div>
                                        ) : (
                                            <span className="text-muted-foreground/30">-</span>
                                        )}
                                    </td>
                                )
                            })}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}
