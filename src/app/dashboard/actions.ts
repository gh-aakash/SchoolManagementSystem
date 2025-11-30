'use server'

import { createClient } from '@/lib/supabase/server'
import { startOfMonth, endOfMonth, format } from 'date-fns'

export async function getDashboardStats() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const { data: profile } = await supabase
        .from('user_profiles')
        .select('school_id')
        .eq('id', user.id)
        .single()

    if (!profile?.school_id) return { error: 'No school linked' }
    const schoolId = profile.school_id

    // 1. Total Students
    const { count: studentCount } = await supabase
        .from('students')
        .select('*', { count: 'exact', head: true })
        .eq('school_id', schoolId)
        .eq('is_active', true)

    // 2. Total Staff
    const { count: staffCount } = await supabase
        .from('staff')
        .select('*', { count: 'exact', head: true })
        .eq('school_id', schoolId)
        .eq('is_active', true)

    // 3. Collection This Month
    const start = format(startOfMonth(new Date()), 'yyyy-MM-dd')
    const end = format(endOfMonth(new Date()), 'yyyy-MM-dd')

    const { data: payments } = await supabase
        .from('fee_payments')
        .select('amount')
        .eq('school_id', schoolId)
        .gte('payment_date', start)
        .lte('payment_date', end)

    const monthlyCollection = payments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0

    // 4. Total Pending Fees (Across all time)
    // We need to sum amount_due from student_fees where status is not Paid?
    // Or just sum amount_due field.
    const { data: pendingFees } = await supabase
        .from('student_fees')
        .select('amount_due, amount_paid')
        .eq('school_id', schoolId)
        .neq('status', 'paid')

    const totalPending = pendingFees?.reduce((sum, f) => {
        const due = Number(f.amount_due) || 0
        const paid = Number(f.amount_paid) || 0
        return sum + (due - paid)
    }, 0) || 0

    return {
        studentCount: studentCount || 0,
        staffCount: staffCount || 0,
        monthlyCollection,
        totalPending
    }
}

export async function getRecentTransactions() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const { data: profile } = await supabase
        .from('user_profiles')
        .select('school_id')
        .eq('id', user.id)
        .single()

    if (!profile?.school_id) return { error: 'No school linked' }

    const { data: transactions } = await supabase
        .from('fee_payments')
        .select(`
            id,
            amount,
            payment_date,
            payment_mode,
            students (
                first_name,
                last_name,
                admission_no,
                classes (name)
            )
        `)
        .eq('school_id', profile.school_id)
        .order('payment_date', { ascending: false })
        .limit(5)

    return { transactions }
}
