
import { createClient } from '@/lib/supabase/server'
import { createExam } from '../actions'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ExamForm } from './exam-form'

export default async function ExamsPage() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return null

    const { data: profile } = await supabase
        .from('user_profiles')
        .select('school_id')
        .eq('id', user.id)
        .single()

    if (!profile?.school_id) return <div>No school linked</div>

    const { data: exams } = await supabase
        .from('exams')
        .select('*')
        .eq('school_id', profile.school_id)
        .order('start_date', { ascending: false })

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-2xl font-bold tracking-tight">Exams</h3>
                    <p className="text-muted-foreground">Manage examination schedules.</p>
                </div>
                <ExamForm />
            </div>

            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Start Date</TableHead>
                                <TableHead>End Date</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {exams?.map((exam) => (
                                <TableRow key={exam.id}>
                                    <TableCell className="font-medium">{exam.name}</TableCell>
                                    <TableCell>{exam.start_date ? new Date(exam.start_date).toLocaleDateString() : '-'}</TableCell>
                                    <TableCell>{exam.end_date ? new Date(exam.end_date).toLocaleDateString() : '-'}</TableCell>
                                </TableRow>
                            ))}
                            {exams?.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                                        No exams found.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
