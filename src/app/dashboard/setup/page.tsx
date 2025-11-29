'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { runMigration } from './actions'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

export default function SetupPage() {
    const [isLoading, setIsLoading] = useState(false)

    async function handleMigration() {
        setIsLoading(true)
        try {
            const result = await runMigration()
            if (result.error) {
                toast.error(result.error)
            } else {
                toast.success(result.message)
            }
        } catch (error) {
            toast.error('Failed to run migration')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="p-6">
            <Card>
                <CardHeader>
                    <CardTitle>System Setup</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p>Click the button below to apply the necessary database changes for Attendance and Automations.</p>
                    <Button onClick={handleMigration} disabled={isLoading}>
                        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Run Database Migration'}
                    </Button>
                </CardContent>
            </Card>
        </div>
    )
}
