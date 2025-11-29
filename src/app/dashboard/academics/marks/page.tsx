
import { createClient } from '@/lib/supabase/server'
import { MarksEntryGrid } from './marks-entry-grid'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { redirect } from 'next/navigation'

export default async function MarksEntryPage({ searchParams }: { searchParams: { exam?: string, class?: string, section?: string, subject?: string } }) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return null

    const { data: profile } = await supabase
        .from('user_profiles')
        .select('school_id')
        .eq('id', user.id)
        .single()

    if (!profile?.school_id) return <div>No school linked</div>

    // Fetch Dropdown Data
    const { data: exams } = await supabase.from('exams').select('*').eq('school_id', profile.school_id)
    const { data: classes } = await supabase.from('classes').select('*').eq('school_id', profile.school_id).order('order_index')
    const { data: subjects } = await supabase.from('subjects').select('*').eq('school_id', profile.school_id).order('name')

    let sections: any[] = []
    if (searchParams.class) {
        const { data } = await supabase.from('sections').select('*').eq('class_id', searchParams.class)
        sections = data || []
    }

    // Fetch Students and Marks if all filters selected
    let students: any[] = []
    let existingMarks: any[] = []

    if (searchParams.exam && searchParams.class && searchParams.section && searchParams.subject) {
        const { data: s } = await supabase
            .from('students')
            .select('id, first_name, last_name, admission_no')
            .eq('school_id', profile.school_id)
            .eq('current_class_id', searchParams.class)
            .eq('current_section_id', searchParams.section)
            .eq('is_active', true)
            .order('first_name')
        students = s || []

        const { data: m } = await supabase
            .from('exam_results')
            .select('student_id, marks_obtained')
            .eq('exam_id', searchParams.exam)
            .eq('subject_id', searchParams.subject)
        existingMarks = m || []
    }

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-2xl font-bold tracking-tight">Marks Entry</h3>
                <p className="text-muted-foreground">Enter marks for a specific exam and subject.</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Select Criteria</CardTitle>
                </CardHeader>
                <CardContent>
                    <form className="grid grid-cols-1 gap-4 md:grid-cols-4">
                        <div className="space-y-2">
                            <Label>Exam</Label>
                            <Select name="exam" defaultValue={searchParams.exam}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select Exam" />
                                </SelectTrigger>
                                <SelectContent>
                                    {exams?.map(e => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Class</Label>
                            <Select name="class" defaultValue={searchParams.class}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select Class" />
                                </SelectTrigger>
                                <SelectContent>
                                    {classes?.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Section</Label>
                            <Select name="section" defaultValue={searchParams.section} disabled={!searchParams.class}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select Section" />
                                </SelectTrigger>
                                <SelectContent>
                                    {sections?.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Subject</Label>
                            <Select name="subject" defaultValue={searchParams.subject}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select Subject" />
                                </SelectTrigger>
                                <SelectContent>
                                    {subjects?.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="md:col-span-4 flex justify-end">
                            <Button type="submit">Load Students</Button>
                        </div>
                    </form>
                </CardContent>
            </Card>

            {searchParams.exam && searchParams.class && searchParams.section && searchParams.subject && (
                <MarksEntryGrid
                    students={students}
                    examId={searchParams.exam}
                    subjectId={searchParams.subject}
                    existingMarks={existingMarks}
                />
            )}
        </div>
    )
}
