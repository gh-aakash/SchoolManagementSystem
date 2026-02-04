import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Users, GraduationCap, IndianRupee, AlertCircle, Plus, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { getDashboardStats, getRecentTransactions } from './actions'
import { FadeIn, SlideUp, StaggerContainer, StaggerItem } from '@/components/ui/motion'
import { format } from 'date-fns'

export default async function DashboardPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    const stats = await getDashboardStats()
    const { transactions } = await getRecentTransactions()

    if ('error' in stats) return <div>Error loading dashboard</div>

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
                    <p className="text-muted-foreground">Welcome back, here's what's happening today.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Link href="/dashboard/students/add">
                        <Button>
                            <Plus className="mr-2 h-4 w-4" /> Add Student
                        </Button>
                    </Link>
                    <Link href="/dashboard/fees/collect">
                        <Button variant="outline">
                            <IndianRupee className="mr-2 h-4 w-4" /> Collect Fee
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Stats Grid */}
            <StaggerContainer className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StaggerItem>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.studentCount}</div>
                            <p className="text-xs text-muted-foreground">Active students</p>
                        </CardContent>
                    </Card>
                </StaggerItem>
                <StaggerItem>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Staff</CardTitle>
                            <GraduationCap className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.staffCount}</div>
                            <p className="text-xs text-muted-foreground">Teachers & Staff</p>
                        </CardContent>
                    </Card>
                </StaggerItem>
                <StaggerItem>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Monthly Collection</CardTitle>
                            <IndianRupee className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">₹{stats.monthlyCollection.toLocaleString()}</div>
                            <p className="text-xs text-muted-foreground">Collected this month</p>
                        </CardContent>
                    </Card>
                </StaggerItem>
                <StaggerItem>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Pending Fees</CardTitle>
                            <AlertCircle className="h-4 w-4 text-red-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-red-600">₹{stats.totalPending.toLocaleString()}</div>
                            <p className="text-xs text-muted-foreground">Total outstanding</p>
                        </CardContent>
                    </Card>
                </StaggerItem>
            </StaggerContainer>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                {/* Recent Transactions */}
                <SlideUp delay={0.2} className="col-span-4">
                    <Card className="h-full">
                        <CardHeader>
                            <CardTitle>Recent Transactions</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-8">
                                {transactions?.map((t: any) => (
                                    <div key={t.id} className="flex items-center">
                                        <div className="space-y-1">
                                            <p className="text-sm font-medium leading-none">
                                                {t.students?.first_name} {t.students?.last_name}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {t.students?.classes?.name} • {t.payment_mode}
                                            </p>
                                        </div>
                                        <div className="ml-auto font-medium">
                                            +₹{t.amount.toLocaleString()}
                                        </div>
                                    </div>
                                ))}
                                {(!transactions || transactions.length === 0) && (
                                    <div className="text-center text-muted-foreground text-sm py-4">
                                        No recent transactions
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </SlideUp>

                {/* Quick Actions / Shortcuts */}
                <SlideUp delay={0.3} className="col-span-3">
                    <Card className="h-full">
                        <CardHeader>
                            <CardTitle>Quick Actions</CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-4">
                            <Link href="/dashboard/attendance">
                                <Button variant="outline" className="w-full justify-between h-auto py-4">
                                    <div className="flex flex-col items-start gap-1">
                                        <span className="font-semibold">Mark Attendance</span>
                                        <span className="text-xs text-muted-foreground">Record daily attendance</span>
                                    </div>
                                    <ArrowRight className="h-4 w-4" />
                                </Button>
                            </Link>
                            <Link href="/dashboard/notifications/create">
                                <Button variant="outline" className="w-full justify-between h-auto py-4">
                                    <div className="flex flex-col items-start gap-1">
                                        <span className="font-semibold">Send Notification</span>
                                        <span className="text-xs text-muted-foreground">SMS, Email, or WhatsApp</span>
                                    </div>
                                    <ArrowRight className="h-4 w-4" />
                                </Button>
                            </Link>
                            <Link href="/dashboard/automations">
                                <Button variant="outline" className="w-full justify-between h-auto py-4">
                                    <div className="flex flex-col items-start gap-1">
                                        <span className="font-semibold">Manage Automations</span>
                                        <span className="text-xs text-muted-foreground">Configure workflows</span>
                                    </div>
                                    <ArrowRight className="h-4 w-4" />
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>
                </SlideUp>
            </div>
        </div>
    )
}
