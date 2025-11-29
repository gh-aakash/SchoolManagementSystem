
'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { collectFee } from '../actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { Search } from 'lucide-react'

interface FeeCollectionFormProps {
    students: any[]
    classes: any[]
    sections: any[]
}

export function FeeCollectionForm({ students, classes, sections }: FeeCollectionFormProps) {
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()

    const [isLoading, setIsLoading] = useState(false)
    const [selectedStudent, setSelectedStudent] = useState<string>('')

    // Filter States
    const [search, setSearch] = useState(searchParams.get('search') || '')
    const [classId, setClassId] = useState(searchParams.get('class_id') || 'all')
    const [sectionId, setSectionId] = useState(searchParams.get('section_id') || 'all')

    // Filter sections based on selected class
    const filteredSections = classId && classId !== 'all'
        ? sections.filter(s => s.class_id === classId)
        : []

    // Update URL when filters change
    function applyFilters(newSearch: string, newClassId: string, newSectionId: string) {
        const params = new URLSearchParams()
        if (newSearch) params.set('search', newSearch)
        if (newClassId && newClassId !== 'all') params.set('class_id', newClassId)
        if (newSectionId && newSectionId !== 'all') params.set('section_id', newSectionId)

        router.replace(`${pathname}?${params.toString()}`)
    }

    // Handlers
    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearch(e.target.value)
        // Debounce could be added here, but for now enter key or blur is fine, 
        // or we can just update on change if we want instant feedback (might be too many requests)
        // Let's stick to "Enter" or a specific effect for now, or just pass it to applyFilters on blur/enter.
    }

    const handleClassChange = (val: string) => {
        setClassId(val)
        setSectionId('all') // Reset section when class changes
        applyFilters(search, val, 'all')
    }

    const handleSectionChange = (val: string) => {
        setSectionId(val)
        applyFilters(search, classId, val)
    }

    const handleSearchSubmit = () => {
        applyFilters(search, classId, sectionId)
    }

    async function handleSubmit(formData: FormData) {
        setIsLoading(true)
        const result = await collectFee(formData)
        setIsLoading(false)

        if (result?.error) {
            toast.error(result.error)
        } else {
            toast.success('Fee collected successfully')
            setSelectedStudent('')
            // Optional: Reset form fields if needed
        }
    }

    const student = students.find(s => s.id === selectedStudent)

    return (
        <Card className="max-w-3xl mx-auto">
            <CardHeader>
                <CardTitle>Collect Fees</CardTitle>
                <CardDescription>Search and select a student to record fee payment.</CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
                {/* Filters Section */}
                <div className="grid gap-4 md:grid-cols-3 p-4 bg-muted/50 rounded-lg border">
                    <div className="space-y-2">
                        <Label className="text-xs font-medium text-muted-foreground">Filter by Class</Label>
                        <Select value={classId} onValueChange={handleClassChange}>
                            <SelectTrigger className="bg-background">
                                <SelectValue placeholder="All Classes" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Classes</SelectItem>
                                {classes.map((c) => (
                                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-xs font-medium text-muted-foreground">Filter by Section</Label>
                        <Select value={sectionId} onValueChange={handleSectionChange} disabled={!classId || classId === 'all'}>
                            <SelectTrigger className="bg-background">
                                <SelectValue placeholder="All Sections" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Sections</SelectItem>
                                {filteredSections.map((s) => (
                                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-xs font-medium text-muted-foreground">Search Student</Label>
                        <div className="relative">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Name or Adm No..."
                                className="pl-8 bg-background"
                                value={search}
                                onChange={handleSearchChange}
                                onKeyDown={(e) => e.key === 'Enter' && handleSearchSubmit()}
                                onBlur={handleSearchSubmit}
                            />
                        </div>
                    </div>
                </div>

                <form action={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="student_id">Select Student</Label>
                        <Select name="student_id" value={selectedStudent} onValueChange={setSelectedStudent} required>
                            <SelectTrigger>
                                <SelectValue placeholder={students.length > 0 ? "Select a student..." : "No students found"} />
                            </SelectTrigger>
                            <SelectContent>
                                {students.map((s) => (
                                    <SelectItem key={s.id} value={s.id}>
                                        {s.first_name} {s.last_name} ({s.admission_no}) - {s.class?.name} {s.section?.name}
                                    </SelectItem>
                                ))}
                                {students.length === 0 && (
                                    <div className="p-2 text-sm text-muted-foreground text-center">
                                        No students match the filters.
                                    </div>
                                )}
                            </SelectContent>
                        </Select>
                    </div>

                    {student && (
                        <div className="rounded-md border bg-card p-4 text-sm space-y-2 shadow-sm">
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <span className="text-muted-foreground">Admission No:</span>
                                    <p className="font-medium">{student.admission_no}</p>
                                </div>
                                <div>
                                    <span className="text-muted-foreground">Father's Name:</span>
                                    <p className="font-medium">{student.father_name}</p>
                                </div>
                                <div>
                                    <span className="text-muted-foreground">Class:</span>
                                    <p className="font-medium">{student.class?.name} - {student.section?.name}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="amount">Amount (₹)</Label>
                            <Input id="amount" name="amount" type="number" required placeholder="0.00" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="payment_mode">Payment Mode</Label>
                            <Select name="payment_mode" defaultValue="Cash" required>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Cash">Cash</SelectItem>
                                    <SelectItem value="Cheque">Cheque</SelectItem>
                                    <SelectItem value="UPI">UPI</SelectItem>
                                    <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="remarks">Remarks</Label>
                        <Input id="remarks" name="remarks" placeholder="Optional transaction details..." />
                    </div>

                    <Button type="submit" className="w-full" disabled={isLoading || !selectedStudent}>
                        {isLoading ? 'Processing...' : 'Collect Fee'}
                    </Button>
                </form>
            </CardContent>
        </Card>
    )
}
