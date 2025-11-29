
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { syncClasses } from './actions'
import { toast } from 'sonner'
import { RefreshCw } from 'lucide-react'

export function SyncClasses() {
    const [isLoading, setIsLoading] = useState(false)

    async function handleSync() {
        setIsLoading(true)
        const result = await syncClasses()
        setIsLoading(false)

        if (result.error) {
            toast.error(result.error)
        } else {
            toast.success(result.message)
        }
    }

    return (
        <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
                <h3 className="text-base font-medium">Sync Classes</h3>
                <p className="text-sm text-muted-foreground">
                    Ensure all standard classes (1-12) are created.
                </p>
            </div>
            <Button onClick={handleSync} disabled={isLoading} loading={isLoading}>
                <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                Sync Classes
            </Button>
        </div>
    )
}
