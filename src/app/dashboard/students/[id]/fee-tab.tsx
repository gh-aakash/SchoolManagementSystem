
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Printer, CreditCard } from 'lucide-react'

export async function StudentFeeTab({ studentId }: { studentId: string }) {
    const supabase = createClient()

    // Fetch Student Fees with details
    const { data: fees } = await supabase
        .from('student_fees')
        .select(`
            *,
            fee_structure:fee_structures (
                amount,
                due_date,
                fee_head:fee_heads (name)
            )
        `)
        .eq('student_id', studentId)
        .order('created_at', { ascending: false })

    return (
        <Card>
            <CardHeader>
                <CardTitle>Fee Status</CardTitle>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Fee Head</TableHead>
                            <TableHead>Due Date</TableHead>
                            <TableHead>Amount Due</TableHead>
                            <TableHead>Amount Paid</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {fees?.map((fee: any) => (
                            <TableRow key={fee.id}>
                                <TableCell className="font-medium">
                                    {fee.fee_structure?.fee_head?.name}
                                </TableCell>
                                <TableCell>
                                    {fee.fee_structure?.due_date
                                        ? new Date(fee.fee_structure.due_date).toLocaleDateString()
                                        : '-'}
                                </TableCell>
                                <TableCell>₹{fee.amount_due}</TableCell>
                                <TableCell>₹{fee.amount_paid}</TableCell>
                                <TableCell>
                                    <Badge variant={fee.status === 'paid' ? 'default' : 'destructive'}>
                                        {fee.status.toUpperCase()}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    {fee.status === 'pending' || fee.status === 'partial' ? (
                                        <Link href={`/dashboard/fees/collect?student_id=${studentId}`}>
                                            <Button size="sm" variant="outline">
                                                <CreditCard className="mr-2 h-4 w-4" />
                                                Pay
                                            </Button>
                                        </Link>
                                    ) : (
                                        <Link href={`/dashboard/fees/receipt/${fee.id}`} target="_blank">
                                            <Button size="sm" variant="ghost">
                                                <Printer className="mr-2 h-4 w-4" />
                                                Receipt
                                            </Button>
                                        </Link>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                        {(!fees || fees.length === 0) && (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center text-muted-foreground">
                                    No fee records found for this student.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    )
}
