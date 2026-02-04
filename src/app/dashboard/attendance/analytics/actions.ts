'use server'

import { createClient } from '@/lib/supabase/server'
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns'

export async function getAttendanceStats() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const { data: profile } = await supabase
        .from('user_profiles')
        .select('school_id')
        .eq('id', user.id)
        .single()

    if (!profile?.school_id) return { error: 'No school linked' }

    const schoolId = profile.school_id
    const today = new Date()
    const thirtyDaysAgo = subDays(today, 30)

    // 1. Daily Attendance Trend (Last 30 Days)
    const { data: dailyLogs } = await supabase
        .from('attendance')
        .select('date, status')
        .eq('school_id', schoolId)
        .gte('date', format(thirtyDaysAgo, 'yyyy-MM-dd'))
        .lte('date', format(today, 'yyyy-MM-dd'))
        .order('date', { ascending: true })

    const dailyTrend = []
    const dateMap = new Map()

    // Initialize map with all dates
    for (let i = 0; i <= 30; i++) {
        const d = subDays(today, 30 - i)
        const dateStr = format(d, 'yyyy-MM-dd')
        dateMap.set(dateStr, { date: format(d, 'MMM dd'), present: 0, total: 0 })
    }

    if (dailyLogs) {
        dailyLogs.forEach(log => {
            if (dateMap.has(log.date)) {
                const entry = dateMap.get(log.date)
                entry.total++
                if (log.status === 'Present') entry.present++
            }
        })
    }

    // Convert to array and calculate percentage
    for (const [key, value] of dateMap) {
        dailyTrend.push({
            date: value.date,
            percentage: value.total > 0 ? Math.round((value.present / value.total) * 100) : 0
        })
    }

    // 2. Class-wise Attendance (Current Month)
    const startMonth = format(startOfMonth(today), 'yyyy-MM-dd')
    const endMonth = format(endOfMonth(today), 'yyyy-MM-dd')

    const { data: classLogs } = await supabase
        .from('attendance')
        .select(`
            status,
            students!inner (
                current_class_id,
                classes (name)
            )
        `)
        .eq('school_id', schoolId)
        .gte('date', startMonth)
        .lte('date', endMonth)

    const classStatsMap = new Map()

    if (classLogs) {
        classLogs.forEach((log: any) => {
            const className = log.students?.classes?.name || 'Unknown'
            if (!classStatsMap.has(className)) {
                classStatsMap.set(className, { name: className, present: 0, total: 0 })
            }
            const entry = classStatsMap.get(className)
            entry.total++
            if (log.status === 'Present') entry.present++
        })
    }

    const classStats = Array.from(classStatsMap.values()).map((item: any) => ({
        name: item.name,
        percentage: item.total > 0 ? Math.round((item.present / item.total) * 100) : 0
    }))

    return {
        dailyTrend,
        classStats
    }
}

export async function exportAttendanceLogs(startDate: string, endDate: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const { data: profile } = await supabase
        .from('user_profiles')
        .select('school_id')
        .eq('id', user.id)
        .single()

    if (!profile?.school_id) return { error: 'No school linked' }

    const { data: logs, error } = await supabase
        .from('attendance')
        .select(`
            date,
            status,
            remarks,
            students (
                first_name,
                last_name,
                admission_no,
                classes (name),
                sections (name)
            )
        `)
        .eq('school_id', profile.school_id)
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: false })

    if (error) return { error: error.message }

    // Convert to CSV
    const headers = ['Date', 'Admission No', 'Student Name', 'Class', 'Section', 'Status', 'Remarks']
    const rows = logs.map((log: any) => [
        log.date,
        log.students?.admission_no || '',
        `${log.students?.first_name} ${log.students?.last_name}`,
        log.students?.classes?.name || '',
        log.students?.sections?.name || '',
        log.status,
        log.remarks || ''
    ])

    const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')

    return { csv: csvContent, filename: `attendance_export_${startDate}_to_${endDate}.csv` }
}
