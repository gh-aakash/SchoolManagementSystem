import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { gatewayFetch } from '@/lib/gateway'
import { checkAndRunAutomations } from '../automations/actions'

export async function getStudentsForAttendance(classId: string, sectionId: string, date: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const { data: profile } = await supabase
        .from('user_profiles')
        .select('school_id')
        .eq('id', user.id)
        .single()

    if (!profile?.school_id) return { error: 'No school linked' }

    try {
        const data = await gatewayFetch(`/api/engagement/attendance/students?school_id=${profile.school_id}&class_id=${classId}&section_id=${sectionId}&date=${date}`)
        return { data }
    } catch (error: any) {
        return { error: error.message }
    }
}

export async function markAttendance(records: { student_id: string; status: string; date: string }[], classId: string, sectionId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const { data: profile } = await supabase
        .from('user_profiles')
        .select('school_id')
        .eq('id', user.id)
        .single()

    if (!profile?.school_id) return { error: 'No school linked' }

    try {
        await gatewayFetch('/api/engagement/attendance/mark', {
            method: 'POST',
            body: JSON.stringify({
                school_id: profile.school_id,
                records,
                class_id: classId,
                section_id: sectionId
            })
        })

        // Trigger Automations for Absentees (Background)
        const absentees = records.filter(r => r.status === 'Absent')
        if (absentees.length > 0) {
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
    } catch (error: any) {
        return { error: error.message }
    }
}

export async function getMasterAttendance(date: string, classId: string, sectionId: string, status: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const { data: profile } = await supabase
        .from('user_profiles')
        .select('school_id')
        .eq('id', user.id)
        .single()

    if (!profile?.school_id) return { error: 'No school linked' }

    try {
        const queryParams = new URLSearchParams({
            school_id: profile.school_id,
            date,
            class_id: classId,
            section_id: sectionId,
            status
        })
        const data = await gatewayFetch(`/api/engagement/attendance/master?${queryParams.toString()}`)
        return { data }
    } catch (error: any) {
        return { error: error.message }
    }
}
