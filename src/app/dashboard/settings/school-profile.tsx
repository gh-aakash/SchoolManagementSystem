
'use client'

import { useState } from 'react'
import { updateSchoolProfile } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'

interface SchoolProfileProps {
    school: any
}

export function SchoolProfile({ school }: SchoolProfileProps) {
    const [isLoading, setIsLoading] = useState(false)

    async function handleSubmit(formData: FormData) {
        setIsLoading(true)
        const result = await updateSchoolProfile(formData)
        setIsLoading(false)

        if (result?.error) {
            toast.error(result.error)
        } else {
            toast.success('School profile updated successfully')
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>School Profile</CardTitle>
                <CardDescription>
                    Manage your school's public information and configuration.
                </CardDescription>
            </CardHeader>
            <form action={handleSubmit}>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="name">School Name</Label>
                            <Input id="name" name="name" defaultValue={school?.name} required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="affiliation_no">Affiliation Number</Label>
                            <Input id="affiliation_no" name="affiliation_no" defaultValue={school?.affiliation_no} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="board">Board</Label>
                            <Input id="board" name="board" defaultValue={school?.board} placeholder="CBSE / ICSE" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="phone">Phone</Label>
                            <Input id="phone" name="phone" defaultValue={school?.phone} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input id="email" name="email" type="email" defaultValue={school?.email} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="website">Website</Label>
                            <Input id="website" name="website" defaultValue={school?.website} />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="address">Address</Label>
                        <Textarea id="address" name="address" defaultValue={school?.address} />
                    </div>
                </CardContent>
                <CardFooter>
                    <Button type="submit" disabled={isLoading}>
                        {isLoading ? 'Saving...' : 'Save Changes'}
                    </Button>
                </CardFooter>
            </form>
        </Card>
    )
}
