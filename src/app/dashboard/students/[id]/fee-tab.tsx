'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { format } from 'date-fns'
import { Loader2, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface StudentFeeTabProps {
    studentId: string
}

export function StudentFeeTab({ studentId }: StudentFeeTabProps) {
    const [fees, setFees] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [statusFilter, setStatusFilter] = useState('all')

    const supabase = createClient()

    const [transactions, setTransactions] = useState<any[]>([])

    useEffect(() => {
        fetchFees()
        fetchTransactions()
    }, [studentId])

    async function fetchFees() {
        setIsLoading(true)
        const { data, error } = await supabase
            .from('student_fees')
            .select(`
                *,
                fee_structure:fee_structures (
                    amount,
                    due_date,
                    fee_head:fee_heads (name),
                    academic_year:academic_years (name)
                )
            `)
            .eq('student_id', studentId)
            .order('created_at', { ascending: false })

        if (!error && data) {
            setFees(data)
        }
        setIsLoading(false)
    }

    async function fetchTransactions() {
        const { data, error } = await supabase
            .from('fee_transactions')
            .select('*')
            .eq('student_id', studentId)
            .order('payment_date', { ascending: false })

        if (!error && data) {
            setTransactions(data)
        }
    }

    const [monthFilter, setMonthFilter] = useState('all')
    const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
        from: undefined,
        to: undefined
    })

    const filteredFees = fees.filter(fee => {
        // Status Filter
        if (statusFilter !== 'all' && fee.status !== statusFilter) return false

        // Month Filter
        if (monthFilter !== 'all') {
            const dueDate = fee.fee_structure?.due_date
            if (!dueDate) return false
            const feeMonth = new Date(dueDate).getMonth() + 1 // 1-12
            if (feeMonth.toString() !== monthFilter) return false
        }

        // Date Range Filter
        if (dateRange.from || dateRange.to) {
            const dueDate = fee.fee_structure?.due_date ? new Date(fee.fee_structure.due_date) : null
            if (!dueDate) return false

            if (dateRange.from && dueDate < dateRange.from) return false
            if (dateRange.to) {
                const endOfDay = new Date(dateRange.to)
                endOfDay.setHours(23, 59, 59, 999)
                if (dueDate > endOfDay) return false
            }
        }

        return true
    })

    // Calculate stats based on FILTERED fees to reflect the selected range/status
    // Wait, usually stats show TOTAL regardless of filter, unless specified. 
    // The user asked "upper statuses should have from to date filter". 
    // So they want the stats to change based on the date filter.
    // Let's use filteredFees for stats, BUT we might want to ignore status/month filter for the top cards if the date filter is meant to be global?
    // Usually "Total Fees" means total for the selected period.
    // So let's use a separate filter for stats if we want to ignore status/month, OR just use filteredFees if all filters apply.
    // The user specifically asked for "from to date filter" for upper statuses.
    // Let's add the Date Picker near the stats or at the top.

    // We need to filter fees JUST by date range for the stats, if we want "Total Fees" to represent the period, 
    // independent of the "Status" filter below (which filters the list).
    // Typically, top-level stats might have their own filter or share a global filter.
    // Let's make the Date Range filter GLOBAL (affecting both stats and list).
    // And the Status/Month filter LOCAL to the list? 
    // Or make all filters global?
    // User said "upper statuses should have from to date filter".
    // Let's add the Date Picker near the stats or at the top.

    const statsFees = fees.filter(fee => {
        if (dateRange.from || dateRange.to) {
            const dueDate = fee.fee_structure?.due_date ? new Date(fee.fee_structure.due_date) : null
            if (!dueDate) return false

            if (dateRange.from && dueDate < dateRange.from) return false
            if (dateRange.to) {
                const endOfDay = new Date(dateRange.to)
                endOfDay.setHours(23, 59, 59, 999)
                if (dueDate > endOfDay) return false
            }
        }
        return true
    })

    const totalDue = statsFees.reduce((sum, fee) => sum + fee.amount_due, 0)
    const totalPaid = statsFees.reduce((sum, fee) => sum + (fee.amount_paid || 0), 0)
    const pendingAmount = totalDue - totalPaid

    return (
        <div className="space-y-6">
            {/* Date Filter */}
            <div className="flex justify-end gap-2">
                <div className="flex items-center gap-2 border rounded-md p-1 bg-card">
                    <Input
                        type="date"
                        className="w-auto h-8 border-0 focus-visible:ring-0"
                        value={dateRange.from ? format(dateRange.from, 'yyyy-MM-dd') : ''}
                        onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value ? new Date(e.target.value) : undefined }))}
                    />
                    <span className="text-muted-foreground">-</span>
                    <Input
                        type="date"
                        className="w-auto h-8 border-0 focus-visible:ring-0"
                        value={dateRange.to ? format(dateRange.to, 'yyyy-MM-dd') : ''}
                        onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value ? new Date(e.target.value) : undefined }))}
                    />
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Fees</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">₹{totalDue.toLocaleString('en-IN')}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Paid Amount</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">₹{totalPaid.toLocaleString('en-IN')}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pending Due</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">₹{pendingAmount.toLocaleString('en-IN')}</div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-1">
                {/* Fee Assignments List */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>Fee Assignments</CardTitle>
                        <div className="flex items-center gap-2">
                            <Select value={monthFilter} onValueChange={setMonthFilter}>
                                <SelectTrigger className="w-[120px] h-8">
                                    <SelectValue placeholder="Month" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Months</SelectItem>
                                    {[
                                        { v: '4', l: 'Apr' }, { v: '5', l: 'May' }, { v: '6', l: 'Jun' },
                                        { v: '7', l: 'Jul' }, { v: '8', l: 'Aug' }, { v: '9', l: 'Sep' },
                                        { v: '10', l: 'Oct' }, { v: '11', l: 'Nov' }, { v: '12', l: 'Dec' },
                                        { v: '1', l: 'Jan' }, { v: '2', l: 'Feb' }, { v: '3', l: 'Mar' },
                                    ].map((m) => (
                                        <SelectItem key={m.v} value={m.v}>{m.l}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="w-[120px] h-8">
                                    <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Status</SelectItem>
                                    <SelectItem value="paid">Paid</SelectItem>
                                    <SelectItem value="pending">Pending</SelectItem>
                                    <SelectItem value="partial">Partial</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="flex justify-center p-8">
                                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                            </div>
                        ) : filteredFees.length > 0 ? (
                            <div className="space-y-4">
                                {filteredFees.map((fee) => (
                                    <div key={fee.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <p className="font-medium">{fee.fee_structure?.fee_head?.name}</p>
                                                <Badge variant={
                                                    fee.status === 'paid' ? 'default' :
                                                        fee.status === 'partial' ? 'secondary' : 'destructive'
                                                } className="text-[10px] px-1.5 py-0 h-5">
                                                    {fee.status.toUpperCase()}
                                                </Badge>
                                            </div>
                                            <div className="flex gap-4 mt-1 text-sm text-muted-foreground">
                                                <span>Due: {fee.fee_structure?.due_date ? format(new Date(fee.fee_structure.due_date), 'dd MMM yyyy') : '-'}</span>
                                                <span>•</span>
                                                <span>Amount: ₹{fee.amount_due.toLocaleString('en-IN')}</span>
                                                {fee.amount_paid > 0 && (
                                                    <>
                                                        <span>•</span>
                                                        <span className="text-green-600">Paid: ₹{fee.amount_paid.toLocaleString('en-IN')}</span>
                                                    </>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            {fee.status !== 'paid' && (
                                                <a href={`/dashboard/fees/collect?studentId=${studentId}&feeId=${fee.id}`}>
                                                    <Button size="sm">Collect</Button>
                                                </a>
                                            )}
                                            {/* We could add a receipt button here if we can link to the specific transaction for this fee. 
                                                However, one fee might be paid in multiple transactions, or one transaction might cover multiple fees.
                                                So listing transactions separately is safer, or we show "View Receipt" if fully paid and link to the latest transaction? 
                                                For now, keeping it simple as requested. */}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center p-8 text-muted-foreground">
                                No fee records found.
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Payment History List */}
                <Card>
                    <CardHeader>
                        <CardTitle>Payment History</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {transactions.length > 0 ? (
                            <div className="space-y-4">
                                {transactions.map((t) => (
                                    <div key={t.id} className="flex items-center justify-between p-4 border rounded-lg">
                                        <div>
                                            <p className="font-medium">Paid via {t.payment_mode}</p>
                                            <p className="text-sm text-muted-foreground">
                                                {format(new Date(t.payment_date), 'dd MMM yyyy, hh:mm a')}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="font-bold text-green-600">₹{t.amount.toLocaleString('en-IN')}</div>
                                            <a href={`/dashboard/fees/receipt/${t.id}`} target="_blank" rel="noreferrer">
                                                <Button variant="outline" size="sm" className="gap-2">
                                                    <Download className="h-4 w-4" /> Receipt
                                                </Button>
                                            </a>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center p-8 text-muted-foreground">
                                No payments recorded yet.
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
