
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { checkAndRunAutomations } from '../automations/actions'

export async function getStudentsForAttendance(classId: string, sectionId: string, date: string) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const { data: profile } = await supabase
        .from('user_profiles')
        .select('school_id')
        .eq('id', user.id)
        .single()

    if (!profile?.school_id) return { error: 'No school linked' }

    // Fetch students
    const { data: students, error } = await supabase
        .from('students')
        .select('id, first_name, last_name, roll_no, father_phone, mother_phone')
        .eq('school_id', profile.school_id)
        .eq('current_class_id', classId)
        .eq('current_section_id', sectionId)
        .eq('is_active', true)
        .order('roll_no', { ascending: true })

    if (error) return { error: error.message }

    // Fetch existing attendance for this date
    const { data: attendance } = await supabase
        .from('attendance')
        .select('student_id, status')
        .eq('school_id', profile.school_id)
        .eq('date', date)
        .in('student_id', students.map(s => s.id))

    // Merge
    const merged = students.map(s => {
        const record = attendance?.find(a => a.student_id === s.id)
        return {
            ...s,
            attendance_status: record?.status
        }
    })

    return { data: merged }
}

export async function markAttendance(records: { student_id: string; status: string; date: string }[], classId: string, sectionId: string) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const { data: profile } = await supabase
        .from('user_profiles')
        .select('school_id')
        .eq('id', user.id)
        .single()

    if (!profile?.school_id) return { error: 'No school linked' }

    // Upsert attendance
    const upsertData = records.map(r => ({
        school_id: profile.school_id,
        student_id: r.student_id,
        class_id: classId,
        section_id: sectionId,
        date: r.date,
        status: r.status
    }))

    const { error } = await supabase
        .from('attendance')
        .upsert(upsertData, { onConflict: 'student_id, date' })

    if (error) return { error: error.message }

    // Trigger Automations for Absentees
    // We filter for 'Absent' status and trigger automation
    const absentees = records.filter(r => r.status === 'Absent')

    if (absentees.length > 0) {
        // Fetch student details for context
        const { data: students } = await supabase
            .from('students')
            .select('*, classes(name), sections(name)')
            .in('id', absentees.map(a => a.student_id))

        if (students) {
            for (const student of students) {
                const context = {
                    school_id: profile.school_id,
                    student: {
                        ...student,
                        class_id: student.classes?.name,
                        section_id: student.sections?.name
                    },
                    attendance: {
                        status: 'Absent',
                        date: records[0].date
                    },
                    phone: student.father_phone || student.mother_phone
                }

                checkAndRunAutomations('ATTENDANCE_ABSENT', context).catch(console.error)
            }
        }
    }

    revalidatePath('/dashboard/attendance')
    return { success: true }
}

export async function getMasterAttendance(date: string, classId: string, sectionId: string, status: string) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const { data: profile } = await supabase
        .from('user_profiles')
        .select('school_id')
        .eq('id', user.id)
        .single()

    if (!profile?.school_id) return { error: 'No school linked' }

    let query = supabase
        .from('attendance')
        .select(`
            *,
            students (
                first_name,
                last_name,
                admission_no,
                classes(name),
                sections(name)
            )
        `)
        .eq('school_id', profile.school_id)
        .eq('date', date)

    if (classId && classId !== 'all') {
        query = query.eq('class_id', classId)
    }

    if (sectionId && sectionId !== 'all') {
        query = query.eq('section_id', sectionId)
    }

    if (status && status !== 'all') {
        query = query.eq('status', status)
    }

    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) return { error: error.message }
    return { data }
}
