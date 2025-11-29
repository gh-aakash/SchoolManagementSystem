
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Bus, MapPin } from 'lucide-react'

export default function TransportDashboard() {
    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-2xl font-bold tracking-tight">Transport</h3>
                <p className="text-muted-foreground">
                    Manage bus routes, stops, and transport fees.
                </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                <Link href="/dashboard/transport/routes">
                    <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Routes</CardTitle>
                            <Bus className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">Manage</div>
                            <p className="text-xs text-muted-foreground">Add and edit bus routes</p>
                        </CardContent>
                    </Card>
                </Link>

                <Link href="/dashboard/transport/stops">
                    <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Stops & Fees</CardTitle>
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">Configure</div>
                            <p className="text-xs text-muted-foreground">Manage stops and assign fees</p>
                        </CardContent>
                    </Card>
                </Link>
            </div>
        </div>
    )
}
