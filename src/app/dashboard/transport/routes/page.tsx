
import { createClient } from '@/lib/supabase/server'
import { createRoute } from '../actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Plus } from 'lucide-react'
import { RouteForm } from './route-form'

export default async function RoutesPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return null

    const { data: profile } = await supabase
        .from('user_profiles')
        .select('school_id')
        .eq('id', user.id)
        .single()

    if (!profile?.school_id) return <div>No school linked</div>

    const { data: routes } = await supabase
        .from('transport_routes')
        .select('*')
        .eq('school_id', profile.school_id)
        .order('route_name')

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-2xl font-bold tracking-tight">Routes</h3>
                    <p className="text-muted-foreground">Manage bus routes and driver details.</p>
                </div>
                <RouteForm />
            </div>

            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Route Name</TableHead>
                                <TableHead>Vehicle No</TableHead>
                                <TableHead>Driver Name</TableHead>
                                <TableHead>Driver Phone</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {routes?.map((route) => (
                                <TableRow key={route.id}>
                                    <TableCell className="font-medium">{route.route_name}</TableCell>
                                    <TableCell>{route.vehicle_number}</TableCell>
                                    <TableCell>{route.driver_name}</TableCell>
                                    <TableCell>{route.driver_phone}</TableCell>
                                </TableRow>
                            ))}
                            {routes?.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                                        No routes found.
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
