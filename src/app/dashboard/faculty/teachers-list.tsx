
'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Phone, Mail, Briefcase } from 'lucide-react'
import Link from 'next/link'

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

export function StaffList({ staff }: { staff: Staff[] }) {
    if (staff.length === 0) {
        return (
            <Card>
                <CardContent className="flex flex-col items-center justify-center h-40 text-muted-foreground">
                    <p>No staff found.</p>
                    <p className="text-sm">Add your first staff member to get started.</p>
                </CardContent>
            </Card>
        )
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {staff.map((member) => (
                <Card key={member.id} className="hover:bg-muted/50 transition-colors h-full relative group">
                    <Link href={`/dashboard/faculty/${member.id}`} className="absolute inset-0 z-0" />
                    <CardContent className="pt-6 relative z-10 pointer-events-none">
                        <div className="flex items-start justify-between">
                            <div className="flex items-center space-x-4">
                                <Avatar className="h-12 w-12">
                                    <AvatarImage src={member.photo_url || ''} />
                                    <AvatarFallback>{member.first_name[0]}{member.last_name?.[0]}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <h4 className="font-semibold">{member.first_name} {member.last_name}</h4>
                                    <div className="flex items-center gap-2">
                                        <Badge variant="secondary" className="text-xs">{member.designation || 'Staff'}</Badge>
                                    </div>
                                </div>
                            </div>
                            <div className="pointer-events-auto">
                                <StaffActions staff={member} />
                            </div>
                        </div>

                        <div className="mt-4 space-y-2 text-sm">
                            <div className="flex items-center text-muted-foreground">
                                <Briefcase className="mr-2 h-4 w-4" />
                                {member.qualification || 'N/A'}
                            </div>
                            {member.email && (
                                <div className="flex items-center text-muted-foreground">
                                    <Mail className="mr-2 h-4 w-4" />
                                    {member.email}
                                </div>
                            )}
                            {member.phone && (
                                <div className="flex items-center text-muted-foreground">
                                    <Phone className="mr-2 h-4 w-4" />
                                    {member.phone}
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    )
}

import { MoreVertical, Trash2, Pencil } from 'lucide-react'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { deleteStaff } from './actions'
import { toast } from 'sonner'
import { EditStaffDialog } from './edit-staff-dialog'
import { useState } from 'react'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"

function StaffActions({ staff }: { staff: Staff }) {
    const [showDeleteAlert, setShowDeleteAlert] = useState(false)

    async function handleDelete() {
        const result = await deleteStaff(staff.id)
        if (result.success) {
            toast.success('Staff deleted successfully')
        } else {
            toast.error(result.error)
        }
    }

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <EditStaffDialog staff={staff} trigger={
                        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                            <Pencil className="mr-2 h-4 w-4" /> Edit
                        </DropdownMenuItem>
                    } />
                    <DropdownMenuItem className="text-destructive" onSelect={() => setShowDeleteAlert(true)}>
                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the staff member and remove their data from our servers.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}
