import { createClient } from '@/lib/supabase/server'
import { BulkFeeAssignForm } from './bulk-assign-form'

export default async function BulkFeeAssignPage() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return null

    const { data: profile } = await supabase
        .from('user_profiles')
        .select('school_id')
        .eq('id', user.id)
        .single()

    if (!profile?.school_id) return <div>No school linked</div>

    // Fetch Classes
    const { data: classes } = await supabase
        .from('classes')
        .select('id, name')
        .eq('school_id', profile.school_id)
        .order('order_index')

    // Fetch Fee Heads
    const { data: feeHeads } = await supabase
        .from('fee_heads')
        .select('id, name')
        .eq('school_id', profile.school_id)
        .order('name')

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-2xl font-bold tracking-tight">Bulk Fee Assignment</h3>
                <p className="text-muted-foreground">
                    Assign a fee to an entire class at once.
                </p>
            </div>
            <BulkFeeAssignForm classes={classes || []} feeHeads={feeHeads || []} />
        </div>
    )
}
