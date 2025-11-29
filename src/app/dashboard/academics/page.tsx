
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BookOpen, Calendar, FileText } from 'lucide-react'

export default function AcademicsDashboard() {
    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-2xl font-bold tracking-tight">Academics</h3>
                <p className="text-muted-foreground">
                    Manage subjects, exams, and results.
                </p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <Link href="/dashboard/academics/subjects">
                    <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Subjects</CardTitle>
                            <BookOpen className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">Manage</div>
                            <p className="text-xs text-muted-foreground">Add and edit subjects</p>
                        </CardContent>
                    </Card>
                </Link>

                <Link href="/dashboard/academics/exams">
                    <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Exams</CardTitle>
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">Schedule</div>
                            <p className="text-xs text-muted-foreground">Create and manage exams</p>
                        </CardContent>
                    </Card>
                </Link>

                <Link href="/dashboard/academics/marks">
                    <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Marks Entry</CardTitle>
                            <FileText className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">Results</div>
                            <p className="text-xs text-muted-foreground">Enter marks for students</p>
                        </CardContent>
                    </Card>
                </Link>
            </div>
        </div>
    )
}
