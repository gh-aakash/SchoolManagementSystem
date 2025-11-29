
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { IndianRupee, Plus, Settings } from 'lucide-react'

export default async function FeesDashboardPage() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return null

    const { data: profile, error } = await supabase
        .from('user_profiles')
        .select('*') // Select all to see what we get
        .eq('id', user.id)
        .single()

    if (!profile?.school_id) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <div className="text-center">
                    <h2 className="text-lg font-semibold">No School Linked</h2>
                    <p className="text-muted-foreground">Please contact your administrator.</p>
                </div>
            </div>
        )
    }

    // Fetch Today's Collection
    const today = new Date().toISOString().split('T')[0]
    const { data: transactions } = await supabase
        .from('fee_transactions')
        .select('amount')
        .eq('school_id', profile.school_id)
        .gte('payment_date', today)

    const todaysCollection = transactions?.reduce((sum, t) => sum + t.amount, 0) || 0

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-2xl font-bold tracking-tight">Fees Dashboard</h3>
                    <p className="text-muted-foreground">
                        Overview of fee collection and management.
                    </p>
                </div>
                <div className="flex gap-2">
                    <Link href="/dashboard/fees/structure">
                        <Button variant="outline">
                            <Settings className="mr-2 h-4 w-4" /> Structure
                        </Button>
                    </Link>
                    <Link href="/dashboard/fees/assign">
                        <Button variant="outline">
                            <Plus className="mr-2 h-4 w-4" /> Assign Fee
                        </Button>
                    </Link>
                    <Link href="/dashboard/fees/collect">
                        <Button>
                            <IndianRupee className="mr-2 h-4 w-4" /> Collect Fee
                        </Button>
                    </Link>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Today's Collection
                        </CardTitle>
                        <IndianRupee className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">₹{todaysCollection.toLocaleString('en-IN')}</div>
                        <p className="text-xs text-muted-foreground">
                            Collected today
                        </p>
                    </CardContent>
                </Card>
                {/* Add more cards like "Total Due", "Defaulters" etc. */}
            </div>
        </div>
    )
}
