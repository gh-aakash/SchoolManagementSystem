'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Loader2, Calendar, User, CheckCircle2, XCircle, Clock, AlertCircle } from 'lucide-react'
import { getMasterAttendance } from './actions'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'

export function MasterAttendanceView({ classes }: { classes: any[] }) {
    const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0])
    const [filterClass, setFilterClass] = useState<string>('all')
    const [filterSection, setFilterSection] = useState<string>('all')
    const [filterStatus, setFilterStatus] = useState<string>('all')
    const [attendanceData, setAttendanceData] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(false)

    // Derived state for sections based on selected class
    const selectedClass = classes.find(c => c.id === filterClass)
    const sections = selectedClass ? selectedClass.sections : []

    useEffect(() => {
        fetchData()
    }, [date, filterClass, filterSection, filterStatus])

    async function fetchData() {
        setIsLoading(true)
        const result = await getMasterAttendance(date, filterClass, filterSection, filterStatus)
        if (result.data) {
            setAttendanceData(result.data)
        }
        setIsLoading(false)
    }

    // Calculate Stats
    const total = attendanceData.length
    const present = attendanceData.filter(a => a.status === 'Present').length
    const absent = attendanceData.filter(a => a.status === 'Absent').length
    const late = attendanceData.filter(a => a.status === 'Late').length
    const halfDay = attendanceData.filter(a => a.status === 'Half Day').length

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Present': return 'bg-green-100 text-green-800 border-green-200'
            case 'Absent': return 'bg-red-100 text-red-800 border-red-200'
            case 'Late': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
            case 'Half Day': return 'bg-orange-100 text-orange-800 border-orange-200'
            default: return 'bg-gray-100 text-gray-800 border-gray-200'
        }
    }

    return (
        <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="pt-6 flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Present</p>
                            <h3 className="text-2xl font-bold text-green-600">{present}</h3>
                        </div>
                        <CheckCircle2 className="w-8 h-8 text-green-100" />
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6 flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Absent</p>
                            <h3 className="text-2xl font-bold text-red-600">{absent}</h3>
                        </div>
                        <XCircle className="w-8 h-8 text-red-100" />
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6 flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Late</p>
                            <h3 className="text-2xl font-bold text-yellow-600">{late}</h3>
                        </div>
                        <Clock className="w-8 h-8 text-yellow-100" />
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6 flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Half Day</p>
                            <h3 className="text-2xl font-bold text-orange-600">{halfDay}</h3>
                        </div>
                        <AlertCircle className="w-8 h-8 text-orange-100" />
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <Card>
                <CardContent className="pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                        <div className="space-y-2">
                            <Label>Date</Label>
                            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                        </div>

                        <div className="space-y-2">
                            <Label>Class</Label>
                            <Select value={filterClass} onValueChange={(v) => { setFilterClass(v); setFilterSection('all'); }}>
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
                            <Label>Section</Label>
                            <Select value={filterSection} onValueChange={setFilterSection} disabled={filterClass === 'all'}>
                                <SelectTrigger>
                                    <SelectValue placeholder="All Sections" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Sections</SelectItem>
                                    {sections.map((s: any) => (
                                        <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Status</Label>
                            <Select value={filterStatus} onValueChange={setFilterStatus}>
                                <SelectTrigger>
                                    <SelectValue placeholder="All Statuses" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Statuses</SelectItem>
                                    <SelectItem value="Present">Present</SelectItem>
                                    <SelectItem value="Absent">Absent</SelectItem>
                                    <SelectItem value="Late">Late</SelectItem>
                                    <SelectItem value="Half Day">Half Day</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Results Table */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                        <span>Attendance Records</span>
                        <Badge variant="outline">{total} Records Found</Badge>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex justify-center p-12">
                            <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        </div>
                    ) : (
                        <div className="relative overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-muted-foreground uppercase bg-muted/50">
                                    <tr>
                                        <th className="px-4 py-3">Student Name</th>
                                        <th className="px-4 py-3">Admission No</th>
                                        <th className="px-4 py-3">Class - Section</th>
                                        <th className="px-4 py-3">Status</th>
                                        <th className="px-4 py-3">Time</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {attendanceData.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                                                No records found for this selection.
                                            </td>
                                        </tr>
                                    ) : (
                                        attendanceData.map((record) => (
                                            <tr key={record.id} className="border-b hover:bg-muted/50">
                                                <td className="px-4 py-3 font-medium">
                                                    {record.students?.first_name} {record.students?.last_name}
                                                </td>
                                                <td className="px-4 py-3 text-muted-foreground">
                                                    {record.students?.admission_no || '-'}
                                                </td>
                                                <td className="px-4 py-3">
                                                    {record.students?.classes?.name} - {record.students?.sections?.name}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <Badge variant="outline" className={getStatusColor(record.status)}>
                                                        {record.status}
                                                    </Badge>
                                                </td>
                                                <td className="px-4 py-3 text-muted-foreground">
                                                    {format(new Date(record.created_at), 'h:mm a')}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
