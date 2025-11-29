
'use server'

import { createClient } from '@/lib/supabase/server'

export async function exportAttendance() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const { data: profile } = await supabase
        .from('user_profiles')
        .select('school_id')
        .eq('id', user.id)
        .single()

    if (!profile?.school_id) return { error: 'No school linked' }

    // Fetch all attendance
    const { data: attendance } = await supabase
        .from('attendance')
        .select(`
            date,
            status,
            remarks,
            students (
                first_name,
                last_name,
                admission_no,
                classes(name),
                sections(name)
            )
        `)
        .eq('school_id', profile.school_id)
        .order('date', { ascending: false })

    if (!attendance) return { error: 'No data' }

    // Convert to CSV
    const headers = ['Date', 'Student Name', 'Admission No', 'Class', 'Section', 'Status', 'Remarks']
    const rows = attendance.map((r: any) => [
        r.date,
        `${r.students?.first_name} ${r.students?.last_name || ''}`,
        r.students?.admission_no,
        r.students?.classes?.name,
        r.students?.sections?.name,
        r.status,
        r.remarks || ''
    ])

    const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')

    return { data: csvContent }
}
