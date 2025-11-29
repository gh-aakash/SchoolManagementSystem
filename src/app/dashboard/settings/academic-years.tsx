
'use client'

import { useState } from 'react'
import { createAcademicYear, setAcademicYearActive } from './academic-actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Check, Plus } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'

interface AcademicYearsProps {
    years: any[]
}

export function AcademicYears({ years }: AcademicYearsProps) {
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)

    async function handleCreate(formData: FormData) {
        setIsLoading(true)
        const result = await createAcademicYear(formData)
        setIsLoading(false)

        if (result?.error) {
            toast.error(result.error)
        } else {
            toast.success('Academic year created')
            setIsDialogOpen(false)
        }
    }

    async function handleActivate(id: string) {
        const result = await setAcademicYearActive(id)
        if (result?.error) {
            toast.error(result.error)
        } else {
            toast.success('Active session updated')
        }
    }

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Academic Years</CardTitle>
                    <CardDescription>Manage academic sessions and set the active year.</CardDescription>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button size="sm"><Plus className="mr-2 h-4 w-4" /> Add Session</Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Add Academic Year</DialogTitle>
                        </DialogHeader>
                        <form action={handleCreate} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Session Name</Label>
                                <Input id="name" name="name" placeholder="2025-2026" required />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="start_date">Start Date</Label>
                                    <Input id="start_date" name="start_date" type="date" required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="end_date">End Date</Label>
                                    <Input id="end_date" name="end_date" type="date" required />
                                </div>
                            </div>
                            <Button type="submit" className="w-full" disabled={isLoading}>
                                {isLoading ? 'Creating...' : 'Create Session'}
                            </Button>
                        </form>
                    </DialogContent>
                </Dialog>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Start Date</TableHead>
                            <TableHead>End Date</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {years.map((year) => (
                            <TableRow key={year.id}>
                                <TableCell className="font-medium">{year.name}</TableCell>
                                <TableCell>{new Date(year.start_date).toLocaleDateString('en-IN')}</TableCell>
                                <TableCell>{new Date(year.end_date).toLocaleDateString('en-IN')}</TableCell>
                                <TableCell>
                                    {year.is_active ? (
                                        <Badge className="bg-green-600">Active</Badge>
                                    ) : (
                                        <Badge variant="outline">Inactive</Badge>
                                    )}
                                </TableCell>
                                <TableCell className="text-right">
                                    {!year.is_active && (
                                        <Button variant="ghost" size="sm" onClick={() => handleActivate(year.id)}>
                                            <Check className="mr-2 h-4 w-4" /> Set Active
                                        </Button>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                        {years.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center text-muted-foreground">
                                    No academic years found.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    )
}
