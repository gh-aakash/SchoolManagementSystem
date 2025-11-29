
'use client'

import { useState } from 'react'
import { createRoute } from '../actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'

export function RouteForm() {
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)

    async function handleSubmit(formData: FormData) {
        setIsLoading(true)
        const result = await createRoute(formData)
        setIsLoading(false)

        if (result?.error) {
            toast.error(result.error)
        } else {
            toast.success('Route created')
            setIsDialogOpen(false)
        }
    }

    return (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
                <Button><Plus className="mr-2 h-4 w-4" /> Add Route</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Add Route</DialogTitle>
                </DialogHeader>
                <form action={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="route_name">Route Name</Label>
                        <Input id="route_name" name="route_name" placeholder="Route 1 - Andheri" required />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="vehicle_number">Vehicle Number</Label>
                        <Input id="vehicle_number" name="vehicle_number" placeholder="MH-02-AB-1234" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="driver_name">Driver Name</Label>
                            <Input id="driver_name" name="driver_name" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="driver_phone">Driver Phone</Label>
                            <Input id="driver_phone" name="driver_phone" />
                        </div>
                    </div>
                    <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading ? 'Creating...' : 'Create Route'}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    )
}
