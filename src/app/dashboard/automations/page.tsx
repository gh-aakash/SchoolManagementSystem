
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, Zap, MoreVertical, Trash2 } from 'lucide-react'
import { Separator } from '@/components/ui/separator'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { AutomationActions } from './automation-card-actions'

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

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {/* Create New Card */}
                <Link href="/dashboard/automations/create">
                    <Card className="border-dashed h-full hover:bg-muted/50 transition-colors cursor-pointer flex flex-col justify-center items-center text-center p-6">
                        <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
                            <Plus className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <h3 className="font-semibold text-lg">Create New</h3>
                        <p className="text-sm text-muted-foreground">Set up a new automation rule</p>
                    </Card>
                </Link>

                {/* Existing Automations */}
                {automations?.map((automation) => (
                    <Card key={automation.id} className="relative">
                        <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                            <div className="space-y-1">
                                <CardTitle className="text-base font-semibold">
                                    {automation.name}
                                </CardTitle>
                                <CardDescription className="text-xs">
                                    Trigger: {automation.trigger_type}
                                </CardDescription>
                            </div>
                            <div className="flex items-center gap-2">
                                <Badge variant={automation.is_active ? 'default' : 'secondary'}>
                                    {automation.is_active ? 'Active' : 'Inactive'}
                                </Badge>
                                <AutomationActions id={automation.id} />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-sm text-muted-foreground space-y-2 mt-2">
                                <div className="flex items-center gap-2">
                                    <Zap className="h-4 w-4" />
                                    <span>{automation.actions.length} Actions configured</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    )
}
