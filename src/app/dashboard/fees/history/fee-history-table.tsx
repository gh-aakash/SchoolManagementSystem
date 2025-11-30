'use client'

import { useState, useEffect } from 'react'
import { getFeeRecords, getFeeTransactions } from '../actions'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { format } from 'date-fns'
import { Download, Filter, Loader2, Printer } from 'lucide-react'
import Link from 'next/link'

interface FeeHistoryProps {
    classes: any[]
}

export function FeeHistoryTable({ classes }: FeeHistoryProps) {
    const [activeTab, setActiveTab] = useState('records')
    const [records, setRecords] = useState<any[]>([])
    const [transactions, setTransactions] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(false)

    // Filters
    const [classId, setClassId] = useState('all')
    const [status, setStatus] = useState('all')
    const [paymentMode, setPaymentMode] = useState('all')
    const [startDate, setStartDate] = useState('')
    const [endDate, setEndDate] = useState('')

    useEffect(() => {
        fetchData()
    }, [activeTab, classId, status, paymentMode, startDate, endDate])

    async function fetchData() {
        setIsLoading(true)
        const filters = {
            classId,
            status,
            paymentMode,
            startDate,
            endDate
        }

        if (activeTab === 'records') {
            const { data } = await getFeeRecords(filters)
            if (data) setRecords(data)
        } else {
            const { data } = await getFeeTransactions(filters)
            if (data) setTransactions(data)
        }
        setIsLoading(false)
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <CardTitle>Fee History & Reports</CardTitle>
                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm">
                                <Download className="mr-2 h-4 w-4" /> Export CSV
                            </Button>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-4">
                        <Select value={classId} onValueChange={setClassId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Class" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Classes</SelectItem>
                                {classes.map((c) => (
                                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        {activeTab === 'records' ? (
                            <Select value={status} onValueChange={setStatus}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Status</SelectItem>
                                    <SelectItem value="paid">Paid</SelectItem>
                                    <SelectItem value="pending">Pending</SelectItem>
                                    <SelectItem value="partial">Partial</SelectItem>
                                </SelectContent>
                            </Select>
                        ) : (
                            <Select value={paymentMode} onValueChange={setPaymentMode}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Payment Mode" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Modes</SelectItem>
                                    <SelectItem value="cash">Cash</SelectItem>
                                    <SelectItem value="online">Online</SelectItem>
                                    <SelectItem value="cheque">Cheque</SelectItem>
                                    <SelectItem value="upi">UPI</SelectItem>
                                </SelectContent>
                            </Select>
                        )}

                        <Input
                            type="date"
                            placeholder="Start Date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                        />
                        <Input
                            type="date"
                            placeholder="End Date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                        />

                        <Button variant="secondary" onClick={fetchData} disabled={isLoading}>
                            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Filter className="h-4 w-4 mr-2" />}
                            Apply
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <TabsList className="grid w-full grid-cols-2 mb-4">
                            <TabsTrigger value="records">Fee Records (Due/Paid)</TabsTrigger>
                            <TabsTrigger value="transactions">Transactions (Payments)</TabsTrigger>
                        </TabsList>

                        <TabsContent value="records">
                            <div className="border rounded-md">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Student</TableHead>
                                            <TableHead>Class</TableHead>
                                            <TableHead>Fee Head</TableHead>
                                            <TableHead>Due Date</TableHead>
                                            <TableHead>Amount</TableHead>
                                            <TableHead>Paid</TableHead>
                                            <TableHead>Status</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {isLoading ? (
                                            <TableRow>
                                                <TableCell colSpan={7} className="text-center py-8">Loading...</TableCell>
                                            </TableRow>
                                        ) : records.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No records found</TableCell>
                                            </TableRow>
                                        ) : (
                                            records.map((r) => (
                                                <TableRow key={r.id}>
                                                    <TableCell>
                                                        <Link href={`/dashboard/students/${r.students?.id}`} className="hover:underline">
                                                            <div className="font-medium">{r.students?.first_name} {r.students?.last_name}</div>
                                                            <div className="text-xs text-muted-foreground">{r.students?.admission_no}</div>
                                                        </Link>
                                                    </TableCell>
                                                    <TableCell>{r.students?.classes?.name}</TableCell>
                                                    <TableCell>{r.fee_structure?.fee_head?.name}</TableCell>
                                                    <TableCell>{r.fee_structure?.due_date ? format(new Date(r.fee_structure.due_date), 'dd MMM yyyy') : '-'}</TableCell>
                                                    <TableCell>₹{r.amount_due}</TableCell>
                                                    <TableCell className="text-green-600">₹{r.amount_paid}</TableCell>
                                                    <TableCell>
                                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${r.status === 'paid' ? 'bg-green-100 text-green-700' :
                                                            r.status === 'partial' ? 'bg-yellow-100 text-yellow-700' :
                                                                'bg-red-100 text-red-700'
                                                            }`}>
                                                            {r.status.toUpperCase()}
                                                        </span>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </TabsContent>

                        <TabsContent value="transactions">
                            <div className="border rounded-md">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Date</TableHead>
                                            <TableHead>Student</TableHead>
                                            <TableHead>Class</TableHead>
                                            <TableHead>Amount</TableHead>
                                            <TableHead>Mode</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {isLoading ? (
                                            <TableRow>
                                                <TableCell colSpan={6} className="text-center py-8">Loading...</TableCell>
                                            </TableRow>
                                        ) : transactions.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No transactions found</TableCell>
                                            </TableRow>
                                        ) : (
                                            transactions.map((t) => (
                                                <TableRow key={t.id}>
                                                    <TableCell>{format(new Date(t.payment_date), 'dd MMM yyyy, hh:mm a')}</TableCell>
                                                    <TableCell>
                                                        <Link href={`/dashboard/students/${t.students?.id}`} className="hover:underline">
                                                            <div className="font-medium">{t.students?.first_name} {t.students?.last_name}</div>
                                                            <div className="text-xs text-muted-foreground">{t.students?.admission_no}</div>
                                                        </Link>
                                                    </TableCell>
                                                    <TableCell>{t.students?.classes?.name}</TableCell>
                                                    <TableCell className="font-bold">₹{t.amount}</TableCell>
                                                    <TableCell className="capitalize">{t.payment_mode}</TableCell>
                                                    <TableCell className="text-right">
                                                        <Link href={`/dashboard/fees/receipt/${t.id}`} target="_blank">
                                                            <Button variant="ghost" size="sm">
                                                                <Printer className="h-4 w-4 mr-2" /> Receipt
                                                            </Button>
                                                        </Link>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
        </div>
    )
}
