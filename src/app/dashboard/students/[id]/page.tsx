import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ArrowLeft, Edit, FileText, Printer } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { IDCard } from './id-card'
import { StudentFeeTab } from './fee-tab'

export default async function StudentProfilePage({ params }: { params: { id: string } }) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return null

    // ... inside component ...
    const { data: student } = await supabase
        .from('students')
        .select(`
            *,
            class:classes(name),
            section:sections(name),
            academic_year:academic_years(name),
            school:schools(*)
        `)
        .eq('id', params.id)
        .single()

    if (!student) return notFound()

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard/students">
                        <Button variant="outline" size="icon">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div>
                        <h3 className="text-2xl font-bold tracking-tight">Student Profile</h3>
                        <p className="text-muted-foreground">
                            View and manage student details.
                        </p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <IDCard student={student} school={student.school} />

                    <Link href={`/dashboard/students/${student.id}/print`} target="_blank">
                        <Button variant="outline" className="gap-2">
                            <Printer className="h-4 w-4" />
                            Admission Form
                        </Button>
                    </Link>

                    <Link href={`/dashboard/students/${student.id}/edit`}>
                        <Button>
                            <Edit className="mr-2 h-4 w-4" /> Edit Profile
                        </Button>
                    </Link>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                {/* Left Column: Basic Info */}
                <Card className="md:col-span-1 h-fit">
                    <CardContent className="pt-6 text-center">
                        <Avatar className="mx-auto h-32 w-32">
                            <AvatarImage src={student.photo_url} />
                            <AvatarFallback className="text-4xl">{student.first_name[0]}</AvatarFallback>
                        </Avatar>
                        <h2 className="mt-4 text-xl font-bold">{student.first_name} {student.last_name}</h2>
                        <p className="text-muted-foreground">{student.admission_no}</p>
                        <div className="mt-2 flex justify-center gap-2">
                            <Badge variant="secondary">{student.class?.name} - {student.section?.name}</Badge>
                            <Badge variant={student.is_active ? 'default' : 'destructive'}>
                                {student.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                        </div>
                    </CardContent>
                </Card>

                {/* Right Column: Tabs */}
                <div className="md:col-span-2">
                    <Tabs defaultValue="details" className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="details">Details</TabsTrigger>
                            <TabsTrigger value="fees">Fees</TabsTrigger>
                        </TabsList>

                        <TabsContent value="details" className="space-y-6 mt-6">
                            {/* Personal Details */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Personal Details</CardTitle>
                                </CardHeader>
                                <CardContent className="grid gap-4 sm:grid-cols-2">
                                    <div>
                                        <div className="text-sm font-medium text-muted-foreground">Gender</div>
                                        <div>{student.gender}</div>
                                    </div>
                                    <div>
                                        <div className="text-sm font-medium text-muted-foreground">Date of Birth</div>
                                        <div>{student.dob}</div>
                                    </div>
                                    <div>
                                        <div className="text-sm font-medium text-muted-foreground">Blood Group</div>
                                        <div>{student.blood_group || '-'}</div>
                                    </div>
                                    <div>
                                        <div className="text-sm font-medium text-muted-foreground">Religion</div>
                                        <div>{student.religion || '-'}</div>
                                    </div>
                                    <div>
                                        <div className="text-sm font-medium text-muted-foreground">Category</div>
                                        <div>{student.caste_category || '-'}</div>
                                    </div>
                                    <div>
                                        <div className="text-sm font-medium text-muted-foreground">Aadhar No</div>
                                        <div>{student.aadhar_no || '-'}</div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Parent Details */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Parent Details</CardTitle>
                                </CardHeader>
                                <CardContent className="grid gap-4 sm:grid-cols-2">
                                    <div>
                                        <div className="text-sm font-medium text-muted-foreground">Father's Name</div>
                                        <div>{student.father_name}</div>
                                    </div>
                                    <div>
                                        <div className="text-sm font-medium text-muted-foreground">Father's Phone</div>
                                        <div>{student.father_phone}</div>
                                    </div>
                                    <div>
                                        <div className="text-sm font-medium text-muted-foreground">Mother's Name</div>
                                        <div>{student.mother_name || '-'}</div>
                                    </div>
                                    <div>
                                        <div className="text-sm font-medium text-muted-foreground">Mother's Phone</div>
                                        <div>{student.mother_phone || '-'}</div>
                                    </div>
                                    <div className="sm:col-span-2">
                                        <div className="text-sm font-medium text-muted-foreground">Address</div>
                                        <div>{student.address || '-'}</div>
                                        <div>{student.city} {student.state} {student.pincode}</div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Documents */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Documents</CardTitle>
                                </CardHeader>
                                <CardContent className="flex gap-4">
                                    {student.tc_url ? (
                                        <a href={student.tc_url} target="_blank" rel="noreferrer" className="flex items-center gap-2 rounded-md border p-3 hover:bg-muted">
                                            <FileText className="h-5 w-5 text-blue-500" />
                                            <span className="text-sm font-medium">Transfer Certificate</span>
                                        </a>
                                    ) : (
                                        <div className="text-sm text-muted-foreground">No TC uploaded</div>
                                    )}
                                    {student.birth_cert_url ? (
                                        <a href={student.birth_cert_url} target="_blank" rel="noreferrer" className="flex items-center gap-2 rounded-md border p-3 hover:bg-muted">
                                            <FileText className="h-5 w-5 text-green-500" />
                                            <span className="text-sm font-medium">Birth Certificate</span>
                                        </a>
                                    ) : (
                                        <div className="text-sm text-muted-foreground">No Birth Certificate uploaded</div>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="fees" className="mt-6">
                            <StudentFeeTab studentId={student.id} />
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </div>
    )
}
