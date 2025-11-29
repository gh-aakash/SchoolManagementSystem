'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Loader2, Calendar, User, Users } from 'lucide-react'
import { getMasterTimetable } from './actions'
import { Badge } from '@/components/ui/badge'

const DAYS = [
    { value: 1, label: 'Monday' },
    { value: 2, label: 'Tuesday' },
    { value: 3, label: 'Wednesday' },
    { value: 4, label: 'Thursday' },
    { value: 5, label: 'Friday' },
    { value: 6, label: 'Saturday' },
    { value: 7, label: 'Sunday' },
]

export function MasterView({ classes, periods, teachers }: any) {
    const [selectedDay, setSelectedDay] = useState<number>(1)
    const [timetableData, setTimetableData] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [filterClass, setFilterClass] = useState<string>('all')
    const [filterTeacher, setFilterTeacher] = useState<string>('all')

    useEffect(() => {
        fetchData()
    }, [selectedDay])

    async function fetchData() {
        setIsLoading(true)
        const result = await getMasterTimetable(selectedDay)
        if (result.data) {
            setTimetableData(result.data)
        }
        setIsLoading(false)
    }

    // Flatten all sections for the grid columns
    const allSections = classes.flatMap((c: any) =>
        c.sections.map((s: any) => ({
            ...s,
            className: c.name,
            classId: c.id
        }))
    )

    // Filter sections based on class selection
    const visibleSections = filterClass === 'all'
        ? allSections
        : allSections.filter((s: any) => s.classId === filterClass)

    // Helper to find entry for a specific period and section
    const getEntry = (periodId: string, sectionId: string) => {
        const entry = timetableData.find(t =>
            t.period_id === periodId &&
            t.section_id === sectionId
        )

        // Apply teacher filter
        if (filterTeacher !== 'all' && entry?.teacher_id !== filterTeacher) {
            return null
        }

        return entry
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardContent className="pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                        <div className="space-y-2">
                            <Label>Day of Week</Label>
                            <Select value={selectedDay.toString()} onValueChange={(v) => setSelectedDay(parseInt(v))}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {DAYS.map(day => (
                                        <SelectItem key={day.value} value={day.value.toString()}>{day.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Filter by Class</Label>
                            <Select value={filterClass} onValueChange={setFilterClass}>
                                <SelectTrigger>
                                    <SelectValue placeholder="All Classes" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Classes</SelectItem>
                                    {classes.map((c: any) => (
                                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Filter by Teacher</Label>
                            <Select value={filterTeacher} onValueChange={setFilterTeacher}>
                                <SelectTrigger>
                                    <SelectValue placeholder="All Teachers" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Teachers</SelectItem>
                                    {teachers.map((t: any) => (
                                        <SelectItem key={t.id} value={t.id}>{t.first_name} {t.last_name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Calendar className="w-5 h-5" />
                        Day Overview: {DAYS.find(d => d.value === selectedDay)?.label}
                    </CardTitle>
                </CardHeader>
                <CardContent className="overflow-x-auto">
                    {isLoading ? (
                        <div className="flex justify-center p-12">
                            <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        </div>
                    ) : (
                        <table className="w-full border-collapse min-w-[1000px]">
                            <thead>
                                <tr>
                                    <th className="border p-2 bg-muted text-left w-32 sticky left-0 z-10">Period</th>
                                    {visibleSections.map((section: any) => (
                                        <th key={section.id} className="border p-2 bg-muted text-center min-w-[140px]">
                                            <div className="font-semibold">{section.className}</div>
                                            <div className="text-xs text-muted-foreground">{section.name}</div>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {periods.map((period: any) => (
                                    <tr key={period.id}>
                                        <td className="border p-2 font-medium sticky left-0 bg-background z-10">
                                            <div>{period.name}</div>
                                            <div className="text-xs text-muted-foreground">{period.start_time} - {period.end_time}</div>
                                        </td>
                                        {visibleSections.map((section: any) => {
                                            const entry = getEntry(period.id, section.id)
                                            return (
                                                <td key={`${period.id}-${section.id}`} className="border p-2 text-center h-20 align-top">
                                                    {entry ? (
                                                        <div className="flex flex-col gap-1 h-full justify-center bg-primary/5 p-1 rounded">
                                                            <div className="font-semibold text-sm text-primary line-clamp-2">
                                                                {entry.subjects?.name}
                                                            </div>
                                                            {entry.staff && (
                                                                <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                                                                    <User className="w-3 h-3" />
                                                                    {entry.staff.first_name}
                                                                </div>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <div className="h-full flex items-center justify-center text-muted-foreground/20">
                                                            -
                                                        </div>
                                                    )}
                                                </td>
                                            )
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
