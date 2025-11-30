
'use client'

import { useState } from 'react'
import { createFeeStructure, deleteFeeStructure, syncFeeStructure } from '../actions'
import { format } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Plus, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'

interface FeeStructureProps {
    structures: any[]
    classes: any[]
    heads: any[]
}

export function FeeStructureList({ structures, classes, heads }: FeeStructureProps) {
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [assignmentType, setAssignmentType] = useState<'one-time' | 'monthly'>('one-time')

    async function handleSubmit(formData: FormData) {
        setIsLoading(true)
        const result = await createFeeStructure(formData)
        setIsLoading(false)

        if (result?.error) {
            toast.error(result.error)
        } else {
            toast.success('Fee Structure assigned')
            setIsDialogOpen(false)
        }
    }

    async function handleDelete(id: string) {
        if (!confirm('Are you sure? This will delete assigned fees for students as well.')) return

        const result = await deleteFeeStructure(id)
        if (result?.error) {
            toast.error(result.error)
        } else {
            toast.success('Fee structure deleted')
        }
    }

    async function handleSync(id: string) {
        toast.promise(syncFeeStructure(id), {
            loading: 'Syncing fees...',
            success: (data: any) => data.message,
            error: (err: any) => err.message || 'Failed to sync'
        })
    }

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Fee Structures</CardTitle>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button size="sm"><Plus className="mr-2 h-4 w-4" /> Assign Fee</Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Assign Fee to Class</DialogTitle>
                        </DialogHeader>
                        <form action={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label>Classes</Label>
                                <div className="border rounded-md p-4 h-48 overflow-y-auto space-y-2">
                                    {classes.map((c) => (
                                        <div key={c.id} className="flex items-center space-x-2">
                                            <input
                                                type="checkbox"
                                                id={`class_${c.id}`}
                                                name="class_ids"
                                                value={c.id}
                                                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                            />
                                            <Label htmlFor={`class_${c.id}`} className="text-sm font-normal cursor-pointer">
                                                {c.name}
                                            </Label>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="fee_head_id">Fee Head</Label>
                                <Select name="fee_head_id" required>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select Fee Head" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {heads.map((h) => (
                                            <SelectItem key={h.id} value={h.id}>{h.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="amount">Amount (₹)</Label>
                                <Input id="amount" name="amount" type="number" required />
                            </div>
                            <div className="space-y-2">
                                <Label>Frequency</Label>
                                <Select
                                    defaultValue="one-time"
                                    onValueChange={(v) => setAssignmentType(v as 'one-time' | 'monthly')}
                                    name="frequency"
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="one-time">One-time (Specific Date)</SelectItem>
                                        <SelectItem value="monthly">Monthly (Select Months)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {assignmentType === 'monthly' && (
                                <div className="space-y-2">
                                    <Label>Select Months</Label>
                                    <div className="grid grid-cols-3 gap-2 border rounded-md p-4">
                                        {[
                                            { v: '4', l: 'Apr' }, { v: '5', l: 'May' }, { v: '6', l: 'Jun' },
                                            { v: '7', l: 'Jul' }, { v: '8', l: 'Aug' }, { v: '9', l: 'Sep' },
                                            { v: '10', l: 'Oct' }, { v: '11', l: 'Nov' }, { v: '12', l: 'Dec' },
                                            { v: '1', l: 'Jan' }, { v: '2', l: 'Feb' }, { v: '3', l: 'Mar' },
                                        ].map((m) => (
                                            <div key={m.v} className="flex items-center space-x-2">
                                                <input
                                                    type="checkbox"
                                                    id={`month_${m.v}`}
                                                    name="months"
                                                    value={m.v}
                                                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                                />
                                                <Label htmlFor={`month_${m.v}`} className="text-sm font-normal cursor-pointer">
                                                    {m.l}
                                                </Label>
                                            </div>
                                        ))}
                                    </div>
                                    <p className="text-xs text-muted-foreground">Fees will be due on the 10th of each selected month.</p>
                                </div>
                            )}

                            {assignmentType === 'one-time' && (
                                <div className="space-y-2">
                                    <Label htmlFor="due_date">Due Date</Label>
                                    <Input id="due_date" name="due_date" type="date" required />
                                </div>
                            )}

                            <Button type="submit" className="w-full" disabled={isLoading}>
                                {isLoading ? 'Assigning...' : 'Assign Fee'}
                            </Button>
                        </form>
                    </DialogContent>
                </Dialog>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Class</TableHead>
                            <TableHead>Fee Head</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Due Date</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {structures.map((s) => (
                            <TableRow key={s.id}>
                                <TableCell>{s.class?.name}</TableCell>
                                <TableCell>{s.fee_head?.name}</TableCell>
                                <TableCell>₹{s.amount}</TableCell>
                                <TableCell>{s.due_date ? format(new Date(s.due_date), 'dd MMM yyyy') : '-'}</TableCell>
                                <TableCell className="text-right">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleSync(s.id)}
                                        className="mr-2"
                                    >
                                        <RefreshCw className="mr-2 h-3 w-3" /> Sync
                                    </Button>
                                    <Button
                                        variant="destructive"
                                        size="sm"
                                        onClick={() => handleDelete(s.id)}
                                    >
                                        Delete
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                        {structures.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center text-muted-foreground">
                                    No fee structures found.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card >
    )
}
