
'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts'

export function AttendanceCharts({ data }: { data: any[] }) {
    // Process data for chart
    // Group by date
    const grouped = data.reduce((acc: any, curr: any) => {
        const date = curr.date
        if (!acc[date]) {
            acc[date] = { date, Present: 0, Absent: 0 }
        }
        if (curr.status === 'Present') acc[date].Present++
        if (curr.status === 'Absent') acc[date].Absent++
        return acc
    }, {})

    const chartData = Object.values(grouped).sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())

    return (
        <Card className="col-span-4">
            <CardHeader>
                <CardTitle>Daily Attendance Overview</CardTitle>
            </CardHeader>
            <CardContent className="pl-2">
                <ResponsiveContainer width="100%" height={350}>
                    <BarChart data={chartData}>
                        <XAxis
                            dataKey="date"
                            stroke="#888888"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(value) => new Date(value).toLocaleDateString()}
                        />
                        <YAxis
                            stroke="#888888"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(value) => `${value}`}
                        />
                        <Tooltip
                            contentStyle={{ backgroundColor: '#333', border: 'none', borderRadius: '8px', color: '#fff' }}
                        />
                        <Bar dataKey="Present" fill="#22c55e" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="Absent" fill="#ef4444" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    )
}
