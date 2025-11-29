'use client'

import { useState } from 'react'
import { createNotification } from '../actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

interface CreateNotificationFormProps {
    classes: any[]
    sections: any[]
    students: any[]
    teachers: any[]
    drivers: any[]
}

export function CreateNotificationForm({ classes, sections, students, teachers, drivers }: CreateNotificationFormProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [recipientGroup, setRecipientGroup] = useState('Student')

    // Student Filters
    const [selectedClass, setSelectedClass] = useState('all')
    const [selectedSection, setSelectedSection] = useState('all')

    // Selection State
    const [selectedRecipients, setSelectedRecipients] = useState<string[]>([])

    // Filter Logic
    const filteredSections = selectedClass && selectedClass !== 'all'
        ? sections.filter(s => s.class_id === selectedClass)
        : []

    const filteredStudents = students.filter(s => {
        if (selectedClass !== 'all' && s.current_class_id !== selectedClass) return false
        if (selectedSection !== 'all' && s.current_section_id !== selectedSection) return false
        return true
    })

    // Handlers
    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            if (recipientGroup === 'Student') {
                setSelectedRecipients(filteredStudents.map(s => s.id))
            }
            // Add logic for teachers/drivers
        } else {
            setSelectedRecipients([])
        }
    }

    const handleSelectOne = (id: string, checked: boolean) => {
        if (checked) {
            setSelectedRecipients(prev => [...prev, id])
        } else {
            setSelectedRecipients(prev => prev.filter(r => r !== id))
        }
    }

    async function handleSubmit(formData: FormData) {
        setIsLoading(true)

        // Append extra data
        formData.append('recipient_group', recipientGroup)
        formData.append('recipients', JSON.stringify(selectedRecipients))

        const result = await createNotification(formData)
        setIsLoading(false)

        if (result?.error) {
            toast.error(result.error)
        } else {
            toast.success('Notification sent successfully!')
            setSelectedRecipients([])
            // Reset form fields if needed
        }
    }

    return (
        <Card className="max-w-4xl mx-auto">
            <form action={handleSubmit}>
                <CardHeader>
                    <CardTitle>Compose Message</CardTitle>
                    <CardDescription>Select recipients and write your message.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">

                    <div className="space-y-2">
                        <Label>Title</Label>
                        <Input name="title" placeholder="e.g. Holiday Announcement" required />
                    </div>

                    <div className="space-y-2">
                        <Label>Message Type</Label>
                        <Select name="type" defaultValue="General" required>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="General">General</SelectItem>
                                <SelectItem value="Fee Reminder">Fee Reminder</SelectItem>
                                <SelectItem value="Exam Result">Exam Result</SelectItem>
                                <SelectItem value="Transport">Transport</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>Recipients</Label>
                        <Tabs value={recipientGroup} onValueChange={(v) => { setRecipientGroup(v); setSelectedRecipients([]); }}>
                            <TabsList className="grid w-full grid-cols-3">
                                <TabsTrigger value="Student">Students</TabsTrigger>
                                <TabsTrigger value="Teacher">Teachers</TabsTrigger>
                                <TabsTrigger value="Driver">Drivers</TabsTrigger>
                            </TabsList>

                            <TabsContent value="Student" className="space-y-4 border rounded-md p-4 mt-2">
                                <div className="flex gap-4">
                                    <div className="w-1/2 space-y-2">
                                        <Label>Class</Label>
                                        <Select value={selectedClass} onValueChange={setSelectedClass}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="All Classes" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">All Classes</SelectItem>
                                                {classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="w-1/2 space-y-2">
                                        <Label>Section</Label>
                                        <Select value={selectedSection} onValueChange={setSelectedSection} disabled={selectedClass === 'all'}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="All Sections" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">All Sections</SelectItem>
                                                {filteredSections.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="border rounded-md max-h-60 overflow-y-auto p-2 space-y-2">
                                    <div className="flex items-center space-x-2 p-2 border-b sticky top-0 bg-background z-10">
                                        <Checkbox
                                            id="select-all"
                                            checked={filteredStudents.length > 0 && selectedRecipients.length === filteredStudents.length}
                                            onCheckedChange={handleSelectAll}
                                        />
                                        <label htmlFor="select-all" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                            Select All ({filteredStudents.length})
                                        </label>
                                    </div>
                                    {filteredStudents.map(student => (
                                        <div key={student.id} className="flex items-center space-x-2 p-2 hover:bg-muted/50 rounded">
                                            <Checkbox
                                                id={student.id}
                                                checked={selectedRecipients.includes(student.id)}
                                                onCheckedChange={(checked) => handleSelectOne(student.id, checked as boolean)}
                                            />
                                            <label htmlFor={student.id} className="text-sm leading-none cursor-pointer flex-1">
                                                {student.first_name} {student.last_name} <span className="text-muted-foreground text-xs">({student.admission_no})</span>
                                            </label>
                                        </div>
                                    ))}
                                    {filteredStudents.length === 0 && <div className="text-center text-muted-foreground p-4">No students found</div>}
                                </div>
                                <div className="text-xs text-muted-foreground text-right">
                                    Selected: {selectedRecipients.length}
                                </div>
                            </TabsContent>

                            <TabsContent value="Teacher">
                                <div className="p-4 text-center text-muted-foreground">Teacher selection coming soon...</div>
                            </TabsContent>

                            <TabsContent value="Driver">
                                <div className="p-4 text-center text-muted-foreground">Driver selection coming soon...</div>
                            </TabsContent>
                        </Tabs>
                    </div>

                    <div className="space-y-2">
                        <Label>Message Body</Label>
                        <Textarea name="message" placeholder="Type your message here..." className="min-h-[150px]" required />
                    </div>

                </CardContent>
                <CardFooter className="flex justify-between">
                    <Button variant="outline" type="button" onClick={() => setSelectedRecipients([])}>Reset</Button>
                    <Button type="submit" disabled={isLoading || selectedRecipients.length === 0}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Send Notification
                    </Button>
                </CardFooter>
            </form>
        </Card>
    )
}
