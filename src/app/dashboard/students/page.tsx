
import { createClient } from '@/lib/supabase/server'
import { gatewayFetch } from '@/lib/gateway'
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
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
    const filters = await searchParams
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return null

    const { data: profile } = await supabase
        .from('user_profiles')
        .select('school_id')
        .eq('id', user.id)
        .single()

    if (!profile?.school_id) return <div>No school linked</div>
    const schoolId = profile.school_id

    // Fetch Classes and Sections for Filters
    const classes = await gatewayFetch(`/api/sis/classes?school_id=${schoolId}`)
    const sections = await gatewayFetch(`/api/sis/sections?school_id=${schoolId}`) // Need to add sections endpoint to SIS

    // Build Query Params with Filters
    const search = (filters.search as string) || ''
    const classId = (filters.class_id as string) || 'all'
    const sectionId = (filters.section_id as string) || 'all'
    const gender = (filters.gender as string) || 'all'

    const queryParams = new URLSearchParams({
        school_id: schoolId,
        search,
        class_id: classId,
        section_id: sectionId,
        gender
    })

    const students = await gatewayFetch(`/api/sis/students?${queryParams.toString()}`)

    // Fetch Attendance Stats via Engagement service
    let studentsWithStats = students || []
    if (students && students.length > 0) {
        try {
            const studentIds = students.map((s: any) => s.id)
            const statsMap = await gatewayFetch('/api/engagement/attendance/stats', {
                method: 'POST',
                body: JSON.stringify({ school_id: schoolId, student_ids: studentIds })
            })

            studentsWithStats = students.map((s: any) => ({
                ...s,
                attendance_pct: statsMap[s.id]
                    ? Math.round((statsMap[s.id].present / statsMap[s.id].total) * 100)
                    : 0
            }))
        } catch (error) {
            console.error('Fetch Attendance Stats Error:', error)
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
