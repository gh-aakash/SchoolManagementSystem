
'use client'

import { useState } from 'react'
import { createFeeStructure } from '../actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'

interface FeeStructureProps {
    structures: any[]
    classes: any[]
    heads: any[]
}

export function FeeStructureList({ structures, classes, heads }: FeeStructureProps) {
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)

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
                                <Label htmlFor="class_id">Class</Label>
                                <Select name="class_id" required>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select Class" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {classes.map((c) => (
                                            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
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
                                <Label htmlFor="due_date">Due Date</Label>
                                <Input id="due_date" name="due_date" type="date" />
                            </div>
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
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {structures.map((s) => (
                            <TableRow key={s.id}>
                                <TableCell>{s.class?.name}</TableCell>
                                <TableCell>{s.fee_head?.name}</TableCell>
                                <TableCell>₹{s.amount}</TableCell>
                                <TableCell>{s.due_date ? new Date(s.due_date).toLocaleDateString() : '-'}</TableCell>
                            </TableRow>
                        ))}
                        {structures.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center text-muted-foreground">
                                    No fee structures found.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    )
}
