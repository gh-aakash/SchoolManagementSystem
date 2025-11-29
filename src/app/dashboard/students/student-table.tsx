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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MoreHorizontal, Trash, ArrowUpCircle } from 'lucide-react'
import { toast } from 'sonner'

import { autoAllocateRollNumbers } from './actions'
import { Loader2 } from 'lucide-react'

interface StudentTableProps {
    students: any[]
    classId?: string
    sectionId?: string
}

export function StudentTable({ students, classId, sectionId }: StudentTableProps) {
    const router = useRouter()
    const [selectedIds, setSelectedIds] = useState<string[]>([])
    const [isAllocating, setIsAllocating] = useState(false)

    function toggleSelectAll() {
        if (selectedIds.length === students.length) {
            setSelectedIds([])
        } else {
            setSelectedIds(students.map(s => s.id))
        }
    }

    function toggleSelect(id: string) {
        if (selectedIds.includes(id)) {
            setSelectedIds(selectedIds.filter(sId => sId !== id))
        } else {
            setSelectedIds([...selectedIds, id])
        }
    }

    async function handleBulkDelete() {
        if (!confirm(`Are you sure you want to delete ${selectedIds.length} students?`)) return

        // TODO: Implement delete action
        toast.info('Bulk delete not implemented yet')
    }

    async function handleAutoAllocate() {
        if (!classId || !sectionId) return
        setIsAllocating(true)
        const result = await autoAllocateRollNumbers(classId, sectionId)
        setIsAllocating(false)
        if (result.success) {
            toast.success(result.message)
        } else {
            toast.error(result.error)
        }
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                {/* Bulk Actions Toolbar */}
                {selectedIds.length > 0 ? (
                    <div className="flex items-center gap-2 rounded-md border bg-muted/50 p-2">
                        <span className="text-sm font-medium px-2">{selectedIds.length} selected</span>
                        <Button size="sm" variant="destructive" onClick={handleBulkDelete}>
                            <Trash className="mr-2 h-4 w-4" /> Delete
                        </Button>
                        <Button size="sm" variant="outline">
                            <ArrowUpCircle className="mr-2 h-4 w-4" /> Promote
                        </Button>
                    </div>
                ) : (
                    <div className="flex-1"></div>
                )}

                {/* Auto Allocate Button (Only when filtered by Class & Section) */}
                {classId && sectionId && (
                    <Button variant="outline" size="sm" onClick={handleAutoAllocate} disabled={isAllocating}>
                        {isAllocating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Auto-Allocate Roll No'}
                    </Button>
                )}
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[50px]">
                                <Checkbox
                                    checked={students.length > 0 && selectedIds.length === students.length}
                                    onCheckedChange={toggleSelectAll}
                                />
                            </TableHead>
                            <TableHead>Student</TableHead>
                            <TableHead>Admission No</TableHead>
                            <TableHead>Roll No</TableHead>
                            <TableHead>Class</TableHead>
                            <TableHead>Father's Name</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {students.map((student) => (
                            <TableRow key={student.id}>
                                <TableCell>
                                    <Checkbox
                                        checked={selectedIds.includes(student.id)}
                                        onCheckedChange={() => toggleSelect(student.id)}
                                    />
                                </TableCell>
                                <TableCell>
                                    <Link href={`/dashboard/students/${student.id}`} className="flex items-center gap-3 hover:underline">
                                        <Avatar>
                                            <AvatarImage src={student.photo_url} />
                                            <AvatarFallback>{student.first_name[0]}{student.last_name?.[0]}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <div className="font-medium flex items-center gap-2">
                                                {student.first_name} {student.last_name}
                                                {student.attendance_pct !== undefined && (
                                                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${student.attendance_pct >= 75 ? 'bg-green-100 text-green-700' :
                                                            student.attendance_pct >= 50 ? 'bg-yellow-100 text-yellow-700' :
                                                                'bg-red-100 text-red-700'
                                                        }`}>
                                                        {student.attendance_pct}%
                                                    </span>
                                                )}
                                            </div>
                                            <div className="text-xs text-muted-foreground">{student.gender}</div>
                                        </div>
                                    </Link>
                                </TableCell>
                                <TableCell>{student.admission_no}</TableCell>
                                <TableCell>{student.roll_no || '-'}</TableCell>
                                <TableCell>
                                    {student.class?.name} - {student.section?.name}
                                </TableCell>
                                <TableCell>{student.father_name}</TableCell>
                                <TableCell>
                                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${student.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                        }`}>
                                        {student.is_active ? 'Active' : 'Inactive'}
                                    </span>
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
                                            <DropdownMenuItem onClick={() => router.push(`/dashboard/students/${student.id}`)}>
                                                View Profile
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem className="text-red-600">Delete</DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        ))}
                        {students.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                                    No students found matching your filters.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
