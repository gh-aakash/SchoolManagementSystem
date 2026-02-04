
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { StopForm } from './stop-form'

export default async function StopsPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return null

    const { data: profile } = await supabase
        .from('user_profiles')
        .select('school_id')
        .eq('id', user.id)
        .single()

    if (!profile?.school_id) return <div>No school linked</div>

    const { data: stops } = await supabase
        .from('transport_stops')
        .select(`
      *,
      route:transport_routes(route_name)
    `)
        .eq('school_id', profile.school_id)
        .order('stop_name')

    const { data: routes } = await supabase
        .from('transport_routes')
        .select('id, route_name')
        .eq('school_id', profile.school_id)
        .order('route_name')

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-2xl font-bold tracking-tight">Stops</h3>
                    <p className="text-muted-foreground">Manage stops and transport fees.</p>
                </div>
                <StopForm routes={routes || []} />
            </div>

            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Stop Name</TableHead>
                                <TableHead>Route</TableHead>
                                <TableHead>Pickup Time</TableHead>
                                <TableHead>Monthly Fee</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {stops?.map((stop) => (
                                <TableRow key={stop.id}>
                                    <TableCell className="font-medium">{stop.stop_name}</TableCell>
                                    <TableCell>{stop.route?.route_name}</TableCell>
                                    <TableCell>{stop.pickup_time}</TableCell>
                                    <TableCell>₹{stop.monthly_fee}</TableCell>
                                </TableRow>
                            ))}
                            {stops?.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                                        No stops found.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
