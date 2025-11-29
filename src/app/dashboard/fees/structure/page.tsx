
import { createClient } from '@/lib/supabase/server'
import { FeeHeads } from './fee-heads'
import { FeeStructureList } from './fee-assignment'

export default async function FeeStructurePage() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return null

    const { data: profile } = await supabase
        .from('user_profiles')
        .select('school_id')
        .eq('id', user.id)
        .single()

    if (!profile?.school_id) return <div>No school linked</div>

    // Fetch Fee Heads
    const { data: heads } = await supabase
        .from('fee_heads')
        .select('*')
        .eq('school_id', profile.school_id)
        .order('name')

    // Fetch Classes
    const { data: classes } = await supabase
        .from('classes')
        .select('*')
        .eq('school_id', profile.school_id)
        .order('order_index')

    // Fetch Fee Structures
    const { data: structures } = await supabase
        .from('fee_structures')
        .select(`
      *,
      class:classes(name),
      fee_head:fee_heads(name)
    `)
        .eq('school_id', profile.school_id)
        .order('created_at', { ascending: false })

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-2xl font-bold tracking-tight">Fee Structure</h3>
                <p className="text-muted-foreground">
                    Define fee heads and assign them to classes.
                </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <FeeHeads heads={heads || []} />
                <FeeStructureList
                    structures={structures || []}
                    classes={classes || []}
                    heads={heads || []}
                />
            </div>
        </div>
    )
}
