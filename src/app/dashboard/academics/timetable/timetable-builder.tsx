
'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Plus, Save, Loader2, GripVertical, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { saveTimetable, createPeriod, getTimetable } from './actions'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog'
import { DndContext, DragOverlay, useDraggable, useDroppable, DragEndEvent } from '@dnd-kit/core'
import { Badge } from '@/components/ui/badge'

interface Period {
    id: string
    name: string
    start_time: string
    end_time: string
}

interface TimetableEntry {
    day_of_week: number
    period_id: string
    subject_id: string
    teacher_id: string
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

export function TimetableBuilder({ classes, initialPeriods, subjects, teachers }: any) {
    const [selectedClass, setSelectedClass] = useState<string>('')
    const [selectedSection, setSelectedSection] = useState<string>('')
    const [periods, setPeriods] = useState<Period[]>(initialPeriods)
    const [timetable, setTimetable] = useState<Record<string, TimetableEntry>>({}) // key: `${day}-${periodId}`
    const [isLoading, setIsLoading] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [activeDragId, setActiveDragId] = useState<string | null>(null)

    const sections = classes.find((c: any) => c.id === selectedClass)?.sections || []

    useEffect(() => {
        if (selectedClass && selectedSection) {
            fetchTimetable()
        }
    }, [selectedClass, selectedSection])

    async function fetchTimetable() {
        setIsLoading(true)
        const { data, error } = await getTimetable(selectedSection)
        if (data) {
            const map: Record<string, TimetableEntry> = {}
            data.forEach((t: any) => {
                map[`${t.day_of_week}-${t.period_id}`] = t
            })
            setTimetable(map)
        }
        setIsLoading(false)
    }

    async function handleSave() {
        if (!selectedSection) return
        setIsSaving(true)
        const entries = Object.values(timetable).map(t => ({
            ...t,
            section_id: selectedSection,
            class_id: selectedClass
        }))

        const result = await saveTimetable(selectedSection, entries)
        if (result.error) {
            toast.error(result.error)
        } else {
            toast.success('Timetable saved successfully')
        }
        setIsSaving(false)
    }

    function updateEntry(day: number, periodId: string, field: 'subject_id' | 'teacher_id', value: string) {
        const key = `${day}-${periodId}`
        setTimetable(prev => ({
            ...prev,
            [key]: {
                ...prev[key],
                day_of_week: day,
                period_id: periodId,
                [field]: value
            }
        }))
    }

    function handleDragEnd(event: DragEndEvent) {
        const { active, over } = event
        setActiveDragId(null)

        if (over && active) {
            const subjectId = active.id as string
            const [dayStr, periodId] = (over.id as string).split('|')
            const day = parseInt(dayStr)

            updateEntry(day, periodId, 'subject_id', subjectId)
        }
    }

    function clearCell(day: number, periodId: string) {
        const key = `${day}-${periodId}`
        setTimetable(prev => {
            const newMap = { ...prev }
            delete newMap[key]
            return newMap
        })
    }

    function handleDuplicate(sourceDay: number, targetDays: number[]) {
        const newTimetable = { ...timetable }

        // Get entries for source day
        const sourceEntries = Object.values(timetable).filter(t => t.day_of_week === sourceDay)

        targetDays.forEach(targetDay => {
            // Clear existing entries for target day first? Or just overwrite?
            // Let's overwrite matching periods.

            sourceEntries.forEach(entry => {
                const key = `${targetDay}-${entry.period_id}`
                newTimetable[key] = {
                    ...entry,
                    day_of_week: targetDay
                }
            })
        })

        setTimetable(newTimetable)
        toast.success('Timetable duplicated successfully')
    }

    return (
        <DndContext onDragStart={(e) => setActiveDragId(e.active.id as string)} onDragEnd={handleDragEnd}>
            <div className="space-y-6">
                {/* Filters */}
                <Card>
                    <CardContent className="pt-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                            <div className="space-y-2">
                                <Label>Class</Label>
                                <Select value={selectedClass} onValueChange={setSelectedClass}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select Class" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {classes.map((c: any) => (
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
                                        {sections.map((s: any) => (
                                            <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex gap-2">
                                <AddPeriodDialog onAdd={(p) => setPeriods([...periods, p])} />
                                <DuplicateDayDialog onDuplicate={handleDuplicate} />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Sidebar - Draggable Subjects */}
                    <div className="lg:col-span-2 space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-sm font-medium">Subjects</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                {subjects.map((subject: any) => (
                                    <DraggableSubject key={subject.id} subject={subject} />
                                ))}
                                <div className="text-xs text-muted-foreground mt-4">
                                    Drag subjects to the grid to assign them.
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Timetable Grid */}
                    <div className="lg:col-span-10">
                        {selectedSection ? (
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between">
                                    <CardTitle>Weekly Schedule</CardTitle>
                                    <Button onClick={handleSave} disabled={isSaving}>
                                        {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                        Save Changes
                                    </Button>
                                </CardHeader>
                                <CardContent className="overflow-x-auto">
                                    {isLoading ? (
                                        <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>
                                    ) : (
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
                                                            const entry = timetable[`${day.value}-${period.id}`] || {}
                                                            const subject = subjects.find((s: any) => s.id === entry.subject_id)
                                                            return (
                                                                <DroppableCell
                                                                    key={`${day.value}-${period.id}`}
                                                                    id={`${day.value}|${period.id}`}
                                                                >
                                                                    {entry.subject_id ? (
                                                                        <div className="space-y-1">
                                                                            <div className="flex items-center justify-between bg-primary/10 p-1 rounded text-xs font-medium text-primary">
                                                                                {subject?.name || 'Unknown'}
                                                                                <button
                                                                                    onClick={() => clearCell(day.value, period.id)}
                                                                                    className="hover:text-destructive"
                                                                                >
                                                                                    <X className="h-3 w-3" />
                                                                                </button>
                                                                            </div>
                                                                            <Select
                                                                                value={entry.teacher_id || ''}
                                                                                onValueChange={(v) => updateEntry(day.value, period.id, 'teacher_id', v)}
                                                                            >
                                                                                <SelectTrigger className="h-6 text-[10px] px-1">
                                                                                    <SelectValue placeholder="Teacher" />
                                                                                </SelectTrigger>
                                                                                <SelectContent>
                                                                                    {teachers.map((t: any) => (
                                                                                        <SelectItem key={t.id} value={t.id}>{t.first_name}</SelectItem>
                                                                                    ))}
                                                                                </SelectContent>
                                                                            </Select>
                                                                        </div>
                                                                    ) : (
                                                                        <div className="h-12 flex items-center justify-center text-xs text-muted-foreground/30">
                                                                            Drop here
                                                                        </div>
                                                                    )}
                                                                </DroppableCell>
                                                            )
                                                        })}
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    )}
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="flex items-center justify-center h-64 border-2 border-dashed rounded-lg text-muted-foreground">
                                Select a Class and Section to view the timetable
                            </div>
                        )}
                    </div>
                </div>
            </div>
            <DragOverlay>
                {activeDragId ? (
                    <div className="bg-background border p-2 rounded shadow-lg opacity-80 w-32 text-sm font-medium">
                        {subjects.find((s: any) => s.id === activeDragId)?.name}
                    </div>
                ) : null}
            </DragOverlay>
        </DndContext>
    )
}

function DraggableSubject({ subject }: { subject: any }) {
    const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
        id: subject.id,
    })

    return (
        <div
            ref={setNodeRef}
            {...listeners}
            {...attributes}
            className={`flex items-center gap-2 p-2 rounded border bg-card hover:bg-accent cursor-move text-sm ${isDragging ? 'opacity-50' : ''}`}
        >
            <GripVertical className="h-4 w-4 text-muted-foreground" />
            {subject.name}
        </div>
    )
}

function DroppableCell({ id, children }: { id: string, children: React.ReactNode }) {
    const { setNodeRef, isOver } = useDroppable({
        id: id,
    })

    return (
        <td
            ref={setNodeRef}
            className={`border p-1 min-w-[120px] transition-colors ${isOver ? 'bg-primary/5' : ''}`}
        >
            {children}
        </td>
    )
}

function AddPeriodDialog({ onAdd }: { onAdd: (p: Period) => void }) {
    const [open, setOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)

    async function handleSubmit(formData: FormData) {
        setIsLoading(true)
        const result = await createPeriod(formData)
        setIsLoading(false)

        if (result.data) {
            onAdd(result.data)
            setOpen(false)
            toast.success('Period added')
        } else {
            toast.error(result.error)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline">
                    <Plus className="mr-2 h-4 w-4" /> Add Period
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Add Class Period</DialogTitle>
                </DialogHeader>
                <form action={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label>Name</Label>
                        <Input name="name" placeholder="e.g. Period 1" required />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Start Time</Label>
                            <Input name="startTime" type="time" required />
                        </div>
                        <div className="space-y-2">
                            <Label>End Time</Label>
                            <Input name="endTime" type="time" required />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={isLoading}>Add Period</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

import { Copy } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'

function DuplicateDayDialog({ onDuplicate }: { onDuplicate: (source: number, targets: number[]) => void }) {
    const [open, setOpen] = useState(false)
    const [sourceDay, setSourceDay] = useState<string>('1')
    const [targetDays, setTargetDays] = useState<number[]>([])

    function handleDuplicate() {
        if (targetDays.length === 0) {
            toast.error('Select at least one target day')
            return
        }
        onDuplicate(parseInt(sourceDay), targetDays)
        setOpen(false)
        setTargetDays([])
    }

    function toggleTarget(day: number) {
        if (targetDays.includes(day)) {
            setTargetDays(targetDays.filter(d => d !== day))
        } else {
            setTargetDays([...targetDays, day])
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline">
                    <Copy className="mr-2 h-4 w-4" /> Duplicate Day
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Duplicate Schedule</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label>Copy From</Label>
                        <Select value={sourceDay} onValueChange={setSourceDay}>
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
                        <Label>Copy To</Label>
                        <div className="grid grid-cols-2 gap-2">
                            {DAYS.map(day => (
                                <div key={day.value} className="flex items-center space-x-2">
                                    <Checkbox
                                        id={`day-${day.value}`}
                                        checked={targetDays.includes(day.value)}
                                        onCheckedChange={() => toggleTarget(day.value)}
                                        disabled={day.value.toString() === sourceDay}
                                    />
                                    <label
                                        htmlFor={`day-${day.value}`}
                                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                    >
                                        {day.label}
                                    </label>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
                <DialogFooter>
                    <Button onClick={handleDuplicate}>Duplicate</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
