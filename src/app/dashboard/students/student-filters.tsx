'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Search, X } from 'lucide-react'
import { useState, useEffect } from 'react'

interface StudentFiltersProps {
    classes: any[]
    sections: any[]
}

export function StudentFilters({ classes, sections }: StudentFiltersProps) {
    const router = useRouter()
    const searchParams = useSearchParams()

    const [search, setSearch] = useState(searchParams.get('search') || '')
    const [classId, setClassId] = useState(searchParams.get('class_id') || 'all')
    const [sectionId, setSectionId] = useState(searchParams.get('section_id') || 'all')
    const [gender, setGender] = useState(searchParams.get('gender') || 'all')

    // Filter sections based on selected class
    const filteredSections = classId && classId !== 'all'
        ? sections.filter(s => s.class_id === classId)
        : []

    const pathname = usePathname()

    // ... existing state ...

    function applyFilters() {
        const params = new URLSearchParams()
        if (search) params.set('search', search)
        if (classId && classId !== 'all') params.set('class_id', classId)
        if (sectionId && sectionId !== 'all') params.set('section_id', sectionId)
        if (gender && gender !== 'all') params.set('gender', gender)

        router.push(`${pathname}?${params.toString()}`)
    }

    function clearFilters() {
        setSearch('')
        setClassId('all')
        setSectionId('all')
        setGender('all')
        router.push(pathname)
    }

    return (
        <div className="flex flex-col gap-4 rounded-lg border bg-card p-4 shadow-sm md:flex-row md:items-end">
            <div className="flex-1 space-y-2">
                <label className="text-sm font-medium">Search</label>
                <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Name or Admission No..."
                        className="pl-8"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
                    />
                </div>
            </div>

            <div className="w-full space-y-2 md:w-48">
                <label className="text-sm font-medium">Class</label>
                <Select value={classId} onValueChange={setClassId}>
                    <SelectTrigger>
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

            <div className="w-full space-y-2 md:w-48">
                <label className="text-sm font-medium">Section</label>
                <Select value={sectionId} onValueChange={setSectionId} disabled={!classId || classId === 'all'}>
                    <SelectTrigger>
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

            <div className="w-full space-y-2 md:w-40">
                <label className="text-sm font-medium">Gender</label>
                <Select value={gender} onValueChange={setGender}>
                    <SelectTrigger>
                        <SelectValue placeholder="All" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="Male">Male</SelectItem>
                        <SelectItem value="Female">Female</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="flex gap-2">
                <Button onClick={applyFilters}>Apply</Button>
                <Button variant="outline" size="icon" onClick={clearFilters} title="Clear Filters">
                    <X className="h-4 w-4" />
                </Button>
            </div>
        </div>
    )
}
