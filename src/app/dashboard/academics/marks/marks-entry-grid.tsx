
'use client'

import { useState } from 'react'
import { updateMarks } from '../actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { toast } from 'sonner'

interface MarksEntryGridProps {
    students: any[]
    examId: string
    subjectId: string
    existingMarks: any[]
}

export function MarksEntryGrid({ students, examId, subjectId, existingMarks }: MarksEntryGridProps) {
    const [marks, setMarks] = useState<Record<string, string>>(() => {
        const initial: Record<string, string> = {}
        existingMarks.forEach(m => {
            initial[m.student_id] = m.marks_obtained
        })
        return initial
    })
    const [isSaving, setIsSaving] = useState(false)

    function handleMarkChange(studentId: string, value: string) {
        setMarks(prev => ({ ...prev, [studentId]: value }))
    }

    async function handleSave() {
        setIsSaving(true)
        const dataToSave = Object.entries(marks).map(([studentId, mark]) => ({
            student_id: studentId,
            exam_id: examId,
            subject_id: subjectId,
            marks: Number(mark)
        })).filter(d => !isNaN(d.marks))

        const result = await updateMarks(dataToSave)
        setIsSaving(false)

        if (result?.error) {
            toast.error(result.error)
        } else {
            toast.success('Marks saved successfully')
        }
    }

    return (
        <div className="space-y-4">
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Student Name</TableHead>
                            <TableHead>Admission No</TableHead>
                            <TableHead>Marks Obtained</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {students.map((student) => (
                            <TableRow key={student.id}>
                                <TableCell className="font-medium">{student.first_name} {student.last_name}</TableCell>
                                <TableCell>{student.admission_no}</TableCell>
                                <TableCell>
                                    <Input
                                        type="number"
                                        className="w-24"
                                        value={marks[student.id] || ''}
                                        onChange={(e) => handleMarkChange(student.id, e.target.value)}
                                    />
                                </TableCell>
                            </TableRow>
                        ))}
                        {students.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                                    No students found in this class.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
            <div className="flex justify-end">
                <Button onClick={handleSave} disabled={isSaving}>
                    {isSaving ? 'Saving...' : 'Save Marks'}
                </Button>
            </div>
        </div>
    )
}
