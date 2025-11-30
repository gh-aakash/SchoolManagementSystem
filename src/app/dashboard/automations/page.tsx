import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { Separator } from '@/components/ui/separator'
import Link from 'next/link'
import { AutomationList } from './automation-list'

export default async function AutomationsPage() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data: profile } = await supabase
        .from('user_profiles')
        .select('school_id')
        .eq('id', user.id)
        .single()

    if (!profile?.school_id) return <div>No school linked</div>

    const { data: automations } = await supabase
        .from('automations')
        .select('*')
        .eq('school_id', profile.school_id)
        .order('created_at', { ascending: false })

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-2xl font-bold tracking-tight">Automations</h3>
                    <p className="text-muted-foreground">
                        Create automated workflows for your school.
                    </p>
                </div>
                <Link href="/dashboard/automations/create">
                    <Button>
                        <Plus className="mr-2 h-4 w-4" /> Create Automation
                    </Button>
                </Link>
            </div>
            <Separator />

            <AutomationList automations={automations || []} />
        </div>
    )
}
