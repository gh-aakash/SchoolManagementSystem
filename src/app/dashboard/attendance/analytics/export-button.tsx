
'use client'

import { Button } from '@/components/ui/button'
import { Download } from 'lucide-react'
import { toast } from 'sonner'
import { exportAttendance } from './actions'

export function ExportButton() {
    async function handleExport() {
        const result = await exportAttendance()
        if (result.data) {
            // Create CSV blob
            const blob = new Blob([result.data], { type: 'text/csv' })
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `attendance-export-${new Date().toISOString().split('T')[0]}.csv`
            a.click()
            toast.success('Export downloaded')
        } else {
            toast.error('Failed to export')
        }
    }

    return (
        <Button variant="outline" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
        </Button>
    )
}
