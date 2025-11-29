
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

import { StudentFilters } from './student-filters'
import { StudentTable } from './student-table'

export default async function StudentsPage({
    searchParams,
}: {
    searchParams: { [key: string]: string | string[] | undefined }
}) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return null

    const { data: profile } = await supabase
        .from('user_profiles')
        .select('school_id')
        .eq('id', user.id)
        .single()

    if (!profile?.school_id) return <div>No school linked</div>

    // Fetch Classes and Sections for Filters
    const { data: classes } = await supabase
        .from('classes')
        .select('id, name')
        .eq('school_id', profile.school_id)
        .order('order_index')

    const { data: sections } = await supabase
        .from('sections')
        .select('id, name, class_id')
        .eq('school_id', profile.school_id)
        .order('name')

    // Build Query with Filters
    let query = supabase
        .from('students')
        .select(`
      *,
      class:classes(name),
      section:sections(name)
    `)
        .eq('school_id', profile.school_id)
        .order('created_at', { ascending: false })

    // Apply Filters
    const search = searchParams.search as string
    const classId = searchParams.class_id as string
    const sectionId = searchParams.section_id as string
    const gender = searchParams.gender as string

    if (search) {
        query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,admission_no.ilike.%${search}%`)
    }
    if (classId && classId !== 'all') {
        query = query.eq('current_class_id', classId)
    }
    if (sectionId && sectionId !== 'all') {
        query = query.eq('current_section_id', sectionId)
    }
    if (gender && gender !== 'all') {
        query = query.eq('gender', gender)
    }

    const { data: students } = await query

    // Fetch Attendance Stats
    let studentsWithStats = students || []
    if (students && students.length > 0) {
        const studentIds = students.map(s => s.id)
        const { data: attendance } = await supabase
            .from('attendance')
            .select('student_id, status')
            .in('student_id', studentIds)
            .eq('school_id', profile.school_id)

        if (attendance) {
            const statsMap: Record<string, { total: number, present: number }> = {}
            attendance.forEach(a => {
                if (!statsMap[a.student_id]) statsMap[a.student_id] = { total: 0, present: 0 }
                statsMap[a.student_id].total++
                if (a.status === 'Present') statsMap[a.student_id].present++
            })

            studentsWithStats = students.map(s => ({
                ...s,
                attendance_pct: statsMap[s.id]
                    ? Math.round((statsMap[s.id].present / statsMap[s.id].total) * 100)
                    : 0
            }))
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-2xl font-bold tracking-tight">Students</h3>
                    <p className="text-muted-foreground">
                        Manage student records and admissions.
                    </p>
                </div>
                <Link href="/dashboard/students/add">
                    <Button>
                        <Plus className="mr-2 h-4 w-4" /> Add Student
                    </Button>
                </Link>
            </div>

            <StudentFilters classes={classes || []} sections={sections || []} />

            <StudentTable
                students={studentsWithStats}
                classId={classId !== 'all' ? classId : undefined}
                sectionId={sectionId !== 'all' ? sectionId : undefined}
            />
        </div>
    )
}
