
'use client'

import { useState } from 'react'
import { createStop } from '../actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'

interface StopFormProps {
    routes: { id: string; route_name: string }[]
}

export function StopForm({ routes }: StopFormProps) {
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)

    async function handleSubmit(formData: FormData) {
        setIsLoading(true)
        const result = await createStop(formData)
        setIsLoading(false)

        if (result?.error) {
            toast.error(result.error)
        } else {
            toast.success('Stop created')
            setIsDialogOpen(false)
        }
    }

    return (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
                <Button><Plus className="mr-2 h-4 w-4" /> Add Stop</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Add Stop</DialogTitle>
                </DialogHeader>
                <form action={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="route_id">Route</Label>
                        <Select name="route_id" required>
                            <SelectTrigger>
                                <SelectValue placeholder="Select Route" />
                            </SelectTrigger>
                            <SelectContent>
                                {routes.map((r) => (
                                    <SelectItem key={r.id} value={r.id}>{r.route_name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="stop_name">Stop Name</Label>
                        <Input id="stop_name" name="stop_name" placeholder="Andheri Station" required />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="pickup_time">Pickup Time</Label>
                            <Input id="pickup_time" name="pickup_time" type="time" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="drop_time">Drop Time</Label>
                            <Input id="drop_time" name="drop_time" type="time" />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="monthly_fee">Monthly Fee (₹)</Label>
                        <Input id="monthly_fee" name="monthly_fee" type="number" required />
                    </div>
                    <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading ? 'Creating...' : 'Create Stop'}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    )
}
