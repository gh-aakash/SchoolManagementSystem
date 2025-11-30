'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Download, Loader2, Calendar } from 'lucide-react'
import { getAttendanceStats, exportAttendanceLogs } from './actions'
import { toast } from 'sonner'
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
    Legend
} from 'recharts'
import { format, subDays } from 'date-fns'
import { FadeIn, SlideUp } from '@/components/ui/motion'

export default function AnalyticsPage() {
    const [stats, setStats] = useState<{ dailyTrend: any[], classStats: any[] } | null>(null)
    const [loading, setLoading] = useState(true)
    const [exportLoading, setExportLoading] = useState(false)
    const [dateRange, setDateRange] = useState({
        start: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
        end: format(new Date(), 'yyyy-MM-dd')
    })

    useEffect(() => {
        async function loadStats() {
            const data = await getAttendanceStats()
            if (data && !data.error) {
                setStats(data as any)
            }
            setLoading(false)
        }
        loadStats()
    }, [])

    async function handleExport() {
        setExportLoading(true)
        const result = await exportAttendanceLogs(dateRange.start, dateRange.end)
        setExportLoading(false)

        if (result.error) {
            toast.error(result.error)
            return
        }

        if (result.csv) {
            const blob = new Blob([result.csv], { type: 'text/csv' })
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = result.filename
            a.click()
            window.URL.revokeObjectURL(url)
            toast.success('Export downloaded successfully')
        }
    }

    if (loading) {
        return <div className="flex items-center justify-center h-96"><Loader2 className="h-8 w-8 animate-spin" /></div>
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h3 className="text-2xl font-bold tracking-tight">Attendance Analytics</h3>
                    <p className="text-muted-foreground">
                        Insights into student attendance trends.
                    </p>
                </div>
                <div className="flex items-end gap-2 bg-muted/30 p-2 rounded-lg border">
                    <div className="grid gap-1.5">
                        <Label htmlFor="start" className="text-xs">Start Date</Label>
                        <Input
                            id="start"
                            type="date"
                            value={dateRange.start}
                            onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                            className="h-8 w-[130px]"
                        />
                    </div>
                    <div className="grid gap-1.5">
                        <Label htmlFor="end" className="text-xs">End Date</Label>
                        <Input
                            id="end"
                            type="date"
                            value={dateRange.end}
                            onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                            className="h-8 w-[130px]"
                        />
                    </div>
                    <Button size="sm" onClick={handleExport} disabled={exportLoading}>
                        {exportLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
                        Export CSV
                    </Button>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Daily Trend Chart */}
                <SlideUp delay={0.1}>
                    <Card>
                        <CardHeader>
                            <CardTitle>30-Day Attendance Trend</CardTitle>
                            <CardDescription>Overall school attendance percentage</CardDescription>
                        </CardHeader>
                        <CardContent className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={stats?.dailyTrend}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis
                                        dataKey="date"
                                        tick={{ fontSize: 12 }}
                                        tickLine={false}
                                        axisLine={false}
                                    />
                                    <YAxis
                                        tick={{ fontSize: 12 }}
                                        tickLine={false}
                                        axisLine={false}
                                        tickFormatter={(value) => `${value}%`}
                                        domain={[0, 100]}
                                    />
                                    <Tooltip />
                                    <Line
                                        type="monotone"
                                        dataKey="percentage"
                                        stroke="#2563eb"
                                        strokeWidth={2}
                                        dot={false}
                                        activeDot={{ r: 4 }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </SlideUp>

                {/* Class-wise Stats */}
                <SlideUp delay={0.2}>
                    <Card>
                        <CardHeader>
                            <CardTitle>Class-wise Performance</CardTitle>
                            <CardDescription>Average attendance for current month</CardDescription>
                        </CardHeader>
                        <CardContent className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={stats?.classStats} layout="vertical">
                                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                                    <XAxis type="number" domain={[0, 100]} hide />
                                    <YAxis
                                        dataKey="name"
                                        type="category"
                                        tick={{ fontSize: 12 }}
                                        tickLine={false}
                                        axisLine={false}
                                        width={80}
                                    />
                                    <Tooltip cursor={{ fill: 'transparent' }} />
                                    <Bar
                                        dataKey="percentage"
                                        fill="#0f172a"
                                        radius={[0, 4, 4, 0]}
                                        barSize={20}
                                        label={{ position: 'right', fill: '#666', fontSize: 12, formatter: (val: any) => `${val}%` }}
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </SlideUp>
            </div>
        </div>
    )
}
