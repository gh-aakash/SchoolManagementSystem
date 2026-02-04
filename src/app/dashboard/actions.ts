'use server'

import { createClient } from '@/lib/supabase/server'
import { gatewayFetch } from '@/lib/gateway'

export async function getDashboardStats() {
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

    try {
        const [sisStats, identityStats, financeStats] = await Promise.all([
            gatewayFetch(`/api/sis/stats?school_id=${schoolId}`),
            gatewayFetch(`/api/identity/stats?school_id=${schoolId}`),
            gatewayFetch(`/api/finance/stats?school_id=${schoolId}`),
        ])

        return {
            studentCount: sisStats.studentCount || 0,
            staffCount: identityStats.staffCount || 0,
            monthlyCollection: financeStats.monthlyCollection || 0,
            totalPending: financeStats.totalPending || 0
        }
    } catch (error: any) {
        console.error('Dashboard Stats Error:', error)
        return { error: error.message }
    }
}

export async function getRecentTransactions() {
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
        const { transactions } = await gatewayFetch(`/api/finance/recent-transactions?school_id=${profile.school_id}`)
        return { transactions }
    } catch (error: any) {
        console.error('Recent Transactions Error:', error)
        return { transactions: [] }
    }
}
