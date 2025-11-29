
'use client'

import { useState } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { getStudentsForAttendance, markAttendance } from './actions'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/input'

interface Class {
    id: string
    name: string
    sections: { id: string; name: string }[]
}

export function MarkAttendanceForm({ classes }: { classes: Class[] }) {
    const [selectedClass, setSelectedClass] = useState<string>('')
    const [selectedSection, setSelectedSection] = useState<string>('')
    const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0])
    const [students, setStudents] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [attendanceData, setAttendanceData] = useState<Record<string, string>>({}) // studentId -> status

    const sections = classes.find(c => c.id === selectedClass)?.sections || []

    async function fetchStudents() {
        if (!selectedClass || !selectedSection) return
        setIsLoading(true)
        const { data, error } = await getStudentsForAttendance(selectedClass, selectedSection, date)
        if (error) {
            toast.error(error)
        } else {
            setStudents(data)
            // Initialize attendance data
            const initialData: Record<string, string> = {}
            data.forEach((s: any) => {
                // Pre-fill existing attendance or default to 'Present'
                initialData[s.id] = s.attendance_status || 'Present'
            })
            setAttendanceData(initialData)
        }
        setIsLoading(false)
    }

    async function handleSave() {
        setIsSaving(true)
        const records = Object.entries(attendanceData).map(([studentId, status]) => ({
            student_id: studentId,
            status,
            date
        }))

        const result = await markAttendance(records, selectedClass, selectedSection)
        if (result.error) {
            toast.error(result.error)
        } else {
            toast.success(result.message)
        }
        setIsSaving(false)
    }

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                <div className="space-y-2">
                    <Label>Class</Label>
                    <Select value={selectedClass} onValueChange={setSelectedClass}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select Class" />
                        </SelectTrigger>
                        <SelectContent>
                            {classes.map(c => (
                                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label>Section</Label>
                    <Select value={selectedSection} onValueChange={setSelectedSection} disabled={!selectedClass}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select Section" />
                        </SelectTrigger>
                        <SelectContent>
                            {sections.map(s => (
                                <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label>Date</Label>
                    <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                </div>
                <Button onClick={fetchStudents} disabled={!selectedClass || !selectedSection || isLoading}>
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Fetch Students'}
                </Button>
            </div>

            {students.length > 0 && (
                <div className="space-y-4">
                    <div className="border rounded-md">
                        <div className="grid grid-cols-12 gap-4 p-4 bg-muted font-medium text-sm">
                            <div className="col-span-1">Roll No</div>
                            <div className="col-span-4">Name</div>
                            <div className="col-span-7">Status</div>
                        </div>
                        {students.map((student) => (
                            <div key={student.id} className="grid grid-cols-12 gap-4 p-4 border-t items-center text-sm">
                                <div className="col-span-1">{student.roll_no || '-'}</div>
                                <div className="col-span-4 font-medium">{student.first_name} {student.last_name}</div>
                                <div className="col-span-7 flex gap-2">
                                    {['Present', 'Absent', 'Late', 'Half-day'].map((status) => (
                                        <Button
                                            key={status}
                                            size="sm"
                                            variant={attendanceData[student.id] === status ?
                                                (status === 'Present' ? 'default' : status === 'Absent' ? 'destructive' : 'secondary')
                                                : 'outline'}
                                            onClick={() => setAttendanceData(prev => ({ ...prev, [student.id]: status }))}
                                            className={attendanceData[student.id] === status ? '' : 'text-muted-foreground'}
                                        >
                                            {status}
                                        </Button>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="flex justify-end">
                        <Button onClick={handleSave} disabled={isSaving}>
                            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Save Attendance'}
                        </Button>
                    </div>
                </div>
            )}
        </div>
    )
}
