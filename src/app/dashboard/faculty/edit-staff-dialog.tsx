'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { updateStaff } from './actions'
import { toast } from 'sonner'
import { Pencil } from 'lucide-react'

interface Staff {
    id: string
    first_name: string
    last_name: string | null
    email: string | null
    phone: string | null
    qualification: string | null
    joining_date: string | null
    designation: string | null
    photo_url: string | null
}

export function EditStaffDialog({ staff, trigger }: { staff: Staff, trigger?: React.ReactNode }) {
    const [open, setOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)

    async function handleSubmit(formData: FormData) {
        setIsLoading(true)
        formData.append('id', staff.id)

        const result = await updateStaff(formData)
        setIsLoading(false)

        if (result.success) {
            setOpen(false)
            toast.success('Staff updated successfully')
        } else {
            toast.error(result.error)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button variant="outline" size="sm">
                        <Pencil className="w-4 h-4 mr-2" />
                        Edit
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Edit Staff Profile</DialogTitle>
                </DialogHeader>
                <form action={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="firstName">First Name</Label>
                            <Input id="firstName" name="firstName" defaultValue={staff.first_name} required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="lastName">Last Name</Label>
                            <Input id="lastName" name="lastName" defaultValue={staff.last_name || ''} />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" name="email" type="email" defaultValue={staff.email || ''} />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="phone">Phone</Label>
                        <Input id="phone" name="phone" type="tel" defaultValue={staff.phone || ''} />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="designation">Designation</Label>
                            <Input id="designation" name="designation" defaultValue={staff.designation || 'Teacher'} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="qualification">Qualification</Label>
                            <Input id="qualification" name="qualification" defaultValue={staff.qualification || ''} />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="joiningDate">Joining Date</Label>
                        <Input id="joiningDate" name="joiningDate" type="date" defaultValue={staff.joining_date || ''} />
                    </div>

                    <DialogFooter>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
