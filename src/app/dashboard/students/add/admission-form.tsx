
'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { createStudent } from '../actions'
import { Button } from '@/components/ui/button'
import { LoadingButton } from '@/components/ui/loading-button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

interface AdmissionFormProps {
    classes: any[]
    sections: any[]
    initialData?: any
    isEditMode?: boolean
}

export function AdmissionForm({ classes, sections, initialData, isEditMode = false }: AdmissionFormProps) {
    const [uploading, setUploading] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [selectedClass, setSelectedClass] = useState<string>(initialData?.current_class_id || '')
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
        setIsSubmitting(true)
        setUploading(true)

        try {
            console.log('--- Admission Process Started ---')
            // Handle File Uploads
            const photoFile = formData.get('photo') as File
            const tcFile = formData.get('tc') as File
            const birthCertFile = formData.get('birth_cert') as File

            // Fix: Don't send "temp-" number. Let backend handle it if empty.
            let admissionNo = formData.get('admission_no') as string
            if (admissionNo === '') admissionNo = undefined as any

            if (photoFile?.size > 0) {
                console.log('Uploading photo...')
                const path = `${selectedClass}/${admissionNo}/photo-${Date.now()}`
                const url = await handleUpload(photoFile, path)
                formData.set('photo_url', url)
            }
            if (tcFile?.size > 0) {
                console.log('Uploading TC...')
                const path = `${selectedClass}/${admissionNo}/tc-${Date.now()}`
                const url = await handleUpload(tcFile, path)
                formData.set('tc_url', url)
            }
            if (birthCertFile?.size > 0) {
                console.log('Uploading Birth Cert...')
                const path = `${selectedClass}/${admissionNo}/birth-${Date.now()}`
                const url = await handleUpload(birthCertFile, path)
                formData.set('birth_cert_url', url)
            }

            console.log('Calling server action: createStudent...')
            const result = await createStudent(formData)

            if (result?.error) {
                console.error('Server Action Error:', result.error)
                toast.error(result.error)
                setIsLoading(false)
                setUploading(false)
                setIsSubmitting(false)
            } else {
                console.log('Success! Redirecting...')
                toast.success(isEditMode ? 'Student updated successfully' : 'Student admitted successfully')
                window.location.href = '/dashboard/students'
            }
        } catch (error: any) {
            console.error('Fatal Catch in AdmissionForm:', error)
            // Allow Next.js redirects to pass through
            if (error.message === 'NEXT_REDIRECT' || error.digest?.startsWith('NEXT_REDIRECT')) {
                window.location.href = '/dashboard/students'
                return
            }
            toast.error('An error occurred. Please try again.')
            setIsLoading(false)
            setUploading(false)
            setIsSubmitting(false)
        }
    }

    const onFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        const formData = new FormData(e.currentTarget)
        await handleSubmit(formData)
    }

    return (
        <form onSubmit={onFormSubmit}>
            <Card>
                <CardHeader>
                    <CardTitle>{isEditMode ? 'Edit Student Profile' : 'New Student Admission'}</CardTitle>
                    <CardDescription>{isEditMode ? 'Update student details.' : 'Enter student details for the current academic session.'}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">

                    {/* Academic Details */}
                    <div>
                        <h4 className="mb-4 text-sm font-medium text-muted-foreground">Academic Details</h4>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                            <div className="space-y-2">
                                <Label htmlFor="admission_no">Admission No</Label>
                                <Input
                                    id="admission_no"
                                    name="admission_no"
                                    defaultValue={initialData?.admission_no}
                                    placeholder="Will be generated automatically"
                                    readOnly={!isEditMode} // Allow editing if needed, or keep readOnly
                                    className="bg-muted"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="class_id">Class *</Label>
                                <Select name="class_id" onValueChange={setSelectedClass} defaultValue={initialData?.current_class_id} required>
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
                                <Select name="section_id" defaultValue={initialData?.current_section_id} disabled={!selectedClass} required>
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
                                <Input id="first_name" name="first_name" defaultValue={initialData?.first_name} required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">Email (Optional)</Label>
                                <Input id="email" name="email" type="email" defaultValue={initialData?.email} placeholder="student@example.com" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="last_name">Last Name</Label>
                                <Input id="last_name" name="last_name" defaultValue={initialData?.last_name} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="gender">Gender *</Label>
                                <Select name="gender" defaultValue={initialData?.gender} required>
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
                                <Input id="dob" name="dob" type="date" defaultValue={initialData?.dob} required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="blood_group">Blood Group</Label>
                                <Select name="blood_group" defaultValue={initialData?.blood_group}>
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
                                <Input id="aadhar_no" name="aadhar_no" defaultValue={initialData?.aadhar_no} placeholder="12 digit number" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="religion">Religion</Label>
                                <Input id="religion" name="religion" defaultValue={initialData?.religion} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="caste_category">Category</Label>
                                <Select name="caste_category" defaultValue={initialData?.caste_category}>
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
                                {initialData?.photo_url && <p className="text-xs text-muted-foreground mt-1">Current: <a href={initialData.photo_url} target="_blank" className="underline">View</a></p>}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="tc">Transfer Certificate (TC)</Label>
                                <Input id="tc" name="tc" type="file" accept=".pdf,.jpg,.jpeg,.png" />
                                {initialData?.tc_url && <p className="text-xs text-muted-foreground mt-1">Current: <a href={initialData.tc_url} target="_blank" className="underline">View</a></p>}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="birth_cert">Birth Certificate</Label>
                                <Input id="birth_cert" name="birth_cert" type="file" accept=".pdf,.jpg,.jpeg,.png" />
                                {initialData?.birth_cert_url && <p className="text-xs text-muted-foreground mt-1">Current: <a href={initialData.birth_cert_url} target="_blank" className="underline">View</a></p>}
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
                                <Input id="father_name" name="father_name" defaultValue={initialData?.father_name} required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="father_phone">Father's Phone *</Label>
                                <Input id="father_phone" name="father_phone" defaultValue={initialData?.father_phone} required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="mother_name">Mother's Name</Label>
                                <Input id="mother_name" name="mother_name" defaultValue={initialData?.mother_name} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="mother_phone">Mother's Phone</Label>
                                <Input id="mother_phone" name="mother_phone" defaultValue={initialData?.mother_phone} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="annual_income">Annual Income (₹)</Label>
                                <Input id="annual_income" name="annual_income" type="number" defaultValue={initialData?.annual_income} />
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
                                <Textarea id="address" name="address" defaultValue={initialData?.address} />
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="city">City</Label>
                                    <Input id="city" name="city" defaultValue={initialData?.city} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="state">State</Label>
                                    <Input id="state" name="state" defaultValue={initialData?.state} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="pincode">Pincode</Label>
                                    <Input id="pincode" name="pincode" defaultValue={initialData?.pincode} />
                                </div>
                            </div>
                        </div>
                    </div>

                </CardContent>
                <CardFooter className="flex justify-end gap-4">
                    <Button variant="outline" type="button" onClick={() => window.history.back()}>Cancel</Button>
                    <LoadingButton
                        type="submit"
                        isLoading={isSubmitting || isLoading || uploading}
                        loadingText={uploading ? 'Uploading...' : 'Processing...'}
                    >
                        {isEditMode ? 'Update Student' : 'Admit Student'}
                    </LoadingButton>
                </CardFooter>
            </Card>
        </form>
    )
}
