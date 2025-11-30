'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Switch } from '@/components/ui/switch'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MoreHorizontal, Trash2, Zap, Search, Filter, Play, Pause } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { toggleAutomationStatus, batchUpdateAutomations } from './actions'
import { motion } from 'framer-motion'

const MotionTableRow = motion(TableRow)

interface AutomationListProps {
    automations: any[]
}

export function AutomationList({ automations }: AutomationListProps) {
    const router = useRouter()
    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState('all')
    const [selectedIds, setSelectedIds] = useState<string[]>([])
    const [isProcessing, setIsProcessing] = useState(false)

    // Filter Logic
    const filteredAutomations = automations.filter(automation => {
        const matchesSearch = automation.name.toLowerCase().includes(search.toLowerCase())
        const matchesStatus = statusFilter === 'all' ||
            (statusFilter === 'active' ? automation.is_active : !automation.is_active)
        return matchesSearch && matchesStatus
    })

    // Selection Logic
    function toggleSelectAll() {
        if (selectedIds.length === filteredAutomations.length) {
            setSelectedIds([])
        } else {
            setSelectedIds(filteredAutomations.map(a => a.id))
        }
    }

    function toggleSelect(id: string) {
        if (selectedIds.includes(id)) {
            setSelectedIds(selectedIds.filter(sId => sId !== id))
        } else {
            setSelectedIds([...selectedIds, id])
        }
    }

    // Actions
    async function handleToggleStatus(id: string, currentStatus: boolean) {
        const result = await toggleAutomationStatus(id, !currentStatus)
        if (result.success) {
            toast.success(`Automation ${!currentStatus ? 'activated' : 'deactivated'}`)
        } else {
            toast.error(result.error)
        }
    }

    async function handleBatchAction(action: 'activate' | 'deactivate' | 'delete') {
        if (!confirm(`Are you sure you want to ${action} ${selectedIds.length} automations?`)) return

        setIsProcessing(true)
        const result = await batchUpdateAutomations(selectedIds, action)
        setIsProcessing(false)

        if (result.success) {
            toast.success(`Batch ${action} successful`)
            setSelectedIds([])
        } else {
            toast.error(result.error)
        }
    }

    return (
        <div className="space-y-4">
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <div className="relative w-full sm:w-64">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search automations..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-8"
                        />
                    </div>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-[130px]">
                            <Filter className="mr-2 h-4 w-4" />
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="inactive">Inactive</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Batch Actions */}
                {selectedIds.length > 0 && (
                    <div className="flex items-center gap-2 bg-muted/50 p-2 rounded-md border animate-in fade-in slide-in-from-top-2">
                        <span className="text-sm font-medium px-2">{selectedIds.length} selected</span>
                        <Button size="sm" variant="outline" onClick={() => handleBatchAction('activate')} disabled={isProcessing}>
                            <Play className="mr-2 h-4 w-4" /> Activate
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleBatchAction('deactivate')} disabled={isProcessing}>
                            <Pause className="mr-2 h-4 w-4" /> Deactivate
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => handleBatchAction('delete')} disabled={isProcessing}>
                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                        </Button>
                    </div>
                )}
            </div>

            {/* Table */}
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[50px]">
                                <Checkbox
                                    checked={filteredAutomations.length > 0 && selectedIds.length === filteredAutomations.length}
                                    onCheckedChange={toggleSelectAll}
                                />
                            </TableHead>
                            <TableHead>Automation Name</TableHead>
                            <TableHead>Trigger</TableHead>
                            <TableHead>Actions</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredAutomations.map((automation, index) => (
                            <MotionTableRow
                                key={automation.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3, delay: index * 0.05 }}
                            >
                                <TableCell>
                                    <Checkbox
                                        checked={selectedIds.includes(automation.id)}
                                        onCheckedChange={() => toggleSelect(automation.id)}
                                    />
                                </TableCell>
                                <TableCell>
                                    <div className="font-medium">{automation.name}</div>
                                    <div className="text-xs text-muted-foreground truncate max-w-[300px]">
                                        {automation.description || 'No description'}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Badge variant="outline">{automation.trigger_type}</Badge>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                        <Zap className="h-3 w-3" />
                                        {automation.actions?.length || 0}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        <Switch
                                            checked={automation.is_active}
                                            onCheckedChange={() => handleToggleStatus(automation.id, automation.is_active)}
                                        />
                                        <span className="text-xs text-muted-foreground w-[50px]">
                                            {automation.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" className="h-8 w-8 p-0">
                                                <span className="sr-only">Open menu</span>
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                            <DropdownMenuItem onClick={() => router.push(`/dashboard/automations/${automation.id}`)}>
                                                Edit Rule
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem
                                                className="text-red-600"
                                                onClick={() => {
                                                    if (confirm('Delete this automation?')) {
                                                        batchUpdateAutomations([automation.id], 'delete')
                                                    }
                                                }}
                                            >
                                                Delete
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </MotionTableRow>
                        ))}
                        {filteredAutomations.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                    No automations found.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
