'use client'

import { useState } from 'react'
import { assignFeeToClass } from '../actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'

interface BulkFeeAssignFormProps {
    classes: any[]
    feeHeads: any[]
}

export function BulkFeeAssignForm({ classes, feeHeads }: BulkFeeAssignFormProps) {
    const [isLoading, setIsLoading] = useState(false)

    async function handleSubmit(formData: FormData) {
        setIsLoading(true)
        const result = await assignFeeToClass(formData)
        setIsLoading(false)

        if (result?.error) {
            toast.error(result.error)
        } else {
            toast.success(result.message)
        }
    }

    return (
        <form action={handleSubmit}>
            <Card>
                <CardHeader>
                    <CardTitle>Assign Fee to Class</CardTitle>
                    <CardDescription>Select a class and fee head to assign fees to all students in that class.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="class_id">Class *</Label>
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
                        <Label htmlFor="fee_head_id">Fee Head *</Label>
                        <Select name="fee_head_id" required>
                            <SelectTrigger>
                                <SelectValue placeholder="Select Fee Head" />
                            </SelectTrigger>
                            <SelectContent>
                                {feeHeads.map((fh) => (
                                    <SelectItem key={fh.id} value={fh.id}>{fh.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="amount">Amount (₹) *</Label>
                        <Input id="amount" name="amount" type="number" required placeholder="e.g. 5000" />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="due_date">Due Date *</Label>
                        <Input id="due_date" name="due_date" type="date" required />
                    </div>
                </CardContent>
                <CardFooter>
                    <Button type="submit" disabled={isLoading} className="w-full">
                        {isLoading ? 'Assigning...' : 'Assign Fee to All Students'}
                    </Button>
                </CardFooter>
            </Card>
        </form>
    )
}
