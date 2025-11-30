import { createClient } from '@/lib/supabase/server'
import { FeeHistoryTable } from './fee-history-table'

export default async function FeeHistoryPage() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return null

    const { data: profile } = await supabase
        .from('user_profiles')
        .select('school_id')
        .eq('id', user.id)
        .single()

    if (!profile?.school_id) return <div>No school linked</div>

    // Fetch Classes for filter
    const { data: classes } = await supabase
        .from('classes')
        .select('id, name')
        .eq('school_id', profile.school_id)
        .order('order_index')

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-2xl font-bold tracking-tight">Fee History</h3>
                <p className="text-muted-foreground">
                    View all fee records and transaction history.
                </p>
            </div>

            <FeeHistoryTable classes={classes || []} />
        </div>
    )
}
