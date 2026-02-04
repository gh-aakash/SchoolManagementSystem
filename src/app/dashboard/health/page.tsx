import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react'
import { gatewayFetch } from '@/lib/gateway'

async function checkService(name: string, path: string) {
    try {
        const start = Date.now()
        const res = await gatewayFetch(path)
        const duration = Date.now() - start
        return { name, status: 'healthy', duration, message: res.status || 'OK' }
    } catch (err: any) {
        return { name, status: 'error', duration: 0, message: err.message }
    }
}

export default async function HealthPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const services = [
        { name: 'Gateway', path: '/health' },
        { name: 'Identity Service', path: '/api/identity/health' },
        { name: 'SIS Service', path: '/api/sis/health' },
        { name: 'Finance Service', path: '/api/finance/health' },
        { name: 'Engagement Service', path: '/api/engagement/health' },
        { name: 'Academic Service', path: '/api/academic/health' },
    ]

    const results = await Promise.all(services.map(s => checkService(s.name, s.path)))

    return (
        <div className="space-y-6 p-6">
            <h1 className="text-3xl font-bold">System Health</h1>
            <p className="text-muted-foreground">Real-time status of all SchoolOS microservices.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {results.map((res) => (
                    <Card key={res.name} className={res.status === 'healthy' ? 'border-green-500/50' : 'border-red-500/50'}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">{res.name}</CardTitle>
                            {res.status === 'healthy' ? (
                                <CheckCircle2 className="h-4 w-4 text-green-500" />
                            ) : (
                                <XCircle className="h-4 w-4 text-red-500" />
                            )}
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {res.status === 'healthy' ? 'Online' : 'Offline'}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                {res.status === 'healthy' ? `Latency: ${res.duration}ms` : res.message}
                            </p>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    )
}
