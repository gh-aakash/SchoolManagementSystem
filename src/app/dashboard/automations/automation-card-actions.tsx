
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { MoreVertical, Trash2, Edit, Play, Loader2 } from 'lucide-react'
import { deleteAutomation, testAutomation } from './actions'
import { toast } from 'sonner'

export function AutomationActions({ id }: { id: string }) {
    const router = useRouter()
    const [isDeleting, setIsDeleting] = useState(false)

    async function handleTest() {
        toast.promise(testAutomation(id), {
            loading: 'Testing rule...',
            success: (data) => data.success ? data.message : `Test Failed: ${data.message}`,
            error: 'Failed to run test'
        })
    }

    async function handleDelete() {
        if (!confirm('Are you sure you want to delete this automation?')) return

        setIsDeleting(true)
        const result = await deleteAutomation(id)
        setIsDeleting(false)

        if (result.error) {
            toast.error(result.error)
        } else {
            toast.success('Automation deleted')
        }
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8" disabled={isDeleting}>
                    {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <MoreVertical className="h-4 w-4" />}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleTest}>
                    <Play className="mr-2 h-4 w-4" /> Test Run
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push(`/dashboard/automations/${id}`)}>
                    <Edit className="mr-2 h-4 w-4" /> Edit
                </DropdownMenuItem>
                <DropdownMenuItem className="text-destructive" onClick={handleDelete}>
                    <Trash2 className="mr-2 h-4 w-4" /> Delete
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
