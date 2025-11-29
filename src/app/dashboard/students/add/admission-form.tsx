
'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { createStudent } from '../actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'

interface AdmissionFormProps {
    classes: any[]
    sections: any[]
}

export function AdmissionForm({ classes, sections }: AdmissionFormProps) {
    const [uploading, setUploading] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [selectedClass, setSelectedClass] = useState<string>('')
    const supabase = createClient()

    // Filter sections based on selected class
    const filteredSections = sections.filter(s => s.class_id === selectedClass)

    async function handleUpload(file: File, path: string) {
        try {
            const { data, error } = await supabase.storage
                .from('student-documents')
                .upload(path, file)

            if (error) throw error

            // Get public URL
            const { data: { publicUrl } } = supabase.storage
                .from('student-documents')
                .getPublicUrl(path)

            return publicUrl
        } catch (error) {
            console.error('Upload error:', error)
            throw error
        }
    }

    async function handleSubmit(formData: FormData) {
        setIsLoading(true)
        setUploading(true)

        try {
            // Handle File Uploads
            const photoFile = formData.get('photo') as File
            const tcFile = formData.get('tc') as File
            const birthCertFile = formData.get('birth_cert') as File
            const admissionNo = formData.get('admission_no') || 'temp-' + Date.now() // Fallback if not generated yet

            if (photoFile?.size > 0) {
                const path = `${selectedClass}/${admissionNo}/photo-${Date.now()}`
                const url = await handleUpload(photoFile, path)
                formData.set('photo_url', url)
            }
            if (tcFile?.size > 0) {
                const path = `${selectedClass}/${admissionNo}/tc-${Date.now()}`
                const url = await handleUpload(tcFile, path)
                formData.set('tc_url', url)
            }
            if (birthCertFile?.size > 0) {
                const path = `${selectedClass}/${admissionNo}/birth-${Date.now()}`
                const url = await handleUpload(birthCertFile, path)
                formData.set('birth_cert_url', url)
            }

            const result = await createStudent(formData)

            if (result?.error) {
                toast.error(result.error)
            } else {
                toast.success('Student admitted successfully')
            }
        } catch (error) {
            toast.error('Failed to upload documents')
        } finally {
            setIsLoading(false)
            setUploading(false)
        }
    }

    return (
        <form action={handleSubmit}>
            <Card>
                <CardHeader>
                    <CardTitle>New Student Admission</CardTitle>
                    <CardDescription>Enter student details for the current academic session.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">

                    {/* Academic Details */}
                    <div>
                        <h4 className="mb-4 text-sm font-medium text-muted-foreground">Academic Details</h4>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                            <div className="space-y-2">
                                <Label htmlFor="admission_no">Admission No (Auto-generated)</Label>
                                <Input
                                    id="admission_no"
                                    name="admission_no"
                                    placeholder="Will be generated automatically"
                                    disabled
                                    className="bg-muted"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="class_id">Class *</Label>
                                <Select name="class_id" onValueChange={setSelectedClass} required>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select Class" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {classes.map((c) => (
                                            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="section_id">Section *</Label>
                                <Select name="section_id" disabled={!selectedClass} required>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select Section" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {filteredSections.map((s) => (
                                            <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>

                    <Separator />

                    {/* Personal Details */}
                    <div>
                        <h4 className="mb-4 text-sm font-medium text-muted-foreground">Personal Details</h4>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                            <div className="space-y-2">
                                <Label htmlFor="first_name">First Name *</Label>
                                <Input id="first_name" name="first_name" required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="last_name">Last Name</Label>
                                <Input id="last_name" name="last_name" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="gender">Gender *</Label>
                                <Select name="gender" required>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select Gender" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Male">Male</SelectItem>
                                        <SelectItem value="Female">Female</SelectItem>
                                        <SelectItem value="Other">Other</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="dob">Date of Birth *</Label>
                                <Input id="dob" name="dob" type="date" required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="blood_group">Blood Group</Label>
                                <Select name="blood_group">
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map(bg => (
                                            <SelectItem key={bg} value={bg}>{bg}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="aadhar_no">Aadhar Number</Label>
                                <Input id="aadhar_no" name="aadhar_no" placeholder="12 digit number" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="religion">Religion</Label>
                                <Input id="religion" name="religion" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="caste_category">Category</Label>
                                <Select name="caste_category">
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select Category" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="General">General</SelectItem>
                                        <SelectItem value="OBC">OBC</SelectItem>
                                        <SelectItem value="SC">SC</SelectItem>
                                        <SelectItem value="ST">ST</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>

                    <Separator />

                    {/* Documents Upload */}
                    <div>
                        <h4 className="mb-4 text-sm font-medium text-muted-foreground">Documents</h4>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                            <div className="space-y-2">
                                <Label htmlFor="photo">Student Photo</Label>
                                <Input id="photo" name="photo" type="file" accept="image/*" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="tc">Transfer Certificate (TC)</Label>
                                <Input id="tc" name="tc" type="file" accept=".pdf,.jpg,.jpeg,.png" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="birth_cert">Birth Certificate</Label>
                                <Input id="birth_cert" name="birth_cert" type="file" accept=".pdf,.jpg,.jpeg,.png" />
                            </div>
                        </div>
                    </div>

                    <Separator />

                    {/* Parent Details */}
                    <div>
                        <h4 className="mb-4 text-sm font-medium text-muted-foreground">Parent Details</h4>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="father_name">Father's Name *</Label>
                                <Input id="father_name" name="father_name" required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="father_phone">Father's Phone *</Label>
                                <Input id="father_phone" name="father_phone" required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="mother_name">Mother's Name</Label>
                                <Input id="mother_name" name="mother_name" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="mother_phone">Mother's Phone</Label>
                                <Input id="mother_phone" name="mother_phone" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="annual_income">Annual Income (₹)</Label>
                                <Input id="annual_income" name="annual_income" type="number" />
                            </div>
                        </div>
                    </div>

                    <Separator />

                    {/* Address */}
                    <div>
                        <h4 className="mb-4 text-sm font-medium text-muted-foreground">Address</h4>
                        <div className="grid grid-cols-1 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="address">Full Address</Label>
                                <Textarea id="address" name="address" />
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="city">City</Label>
                                    <Input id="city" name="city" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="state">State</Label>
                                    <Input id="state" name="state" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="pincode">Pincode</Label>
                                    <Input id="pincode" name="pincode" />
                                </div>
                            </div>
                        </div>
                    </div>

                </CardContent>
                <CardFooter className="flex justify-end gap-4">
                    <Button variant="outline" type="button" onClick={() => window.history.back()}>Cancel</Button>
                    <Button type="submit" disabled={isLoading || uploading}>
                        {uploading ? 'Uploading...' : (isLoading ? 'Admitting...' : 'Admit Student')}
                    </Button>
                </CardFooter>
            </Card>
        </form>
    )
}
