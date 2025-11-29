
'use client'

import { useState } from 'react'
import { login, signup } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'

export function LoginForm() {
    const [isLoading, setIsLoading] = useState(false)

    async function handleLogin(formData: FormData) {
        setIsLoading(true)
        const result = await login(formData)
        setIsLoading(false)

        if (result?.error) {
            toast.error(result.error)
        } else {
            toast.success('Logged in successfully')
        }
    }

    async function handleSignup(formData: FormData) {
        setIsLoading(true)
        const result = await signup(formData)
        setIsLoading(false)

        if (result?.error) {
            toast.error(result.error)
        } else {
            toast.success('Account created! Please check your email.')
        }
    }

    return (
        <Tabs defaultValue="login" className="w-[400px]">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
                <Card>
                    <CardHeader>
                        <CardTitle>Login</CardTitle>
                        <CardDescription>
                            Enter your email and password to access your account.
                        </CardDescription>
                    </CardHeader>
                    <form action={handleLogin}>
                        <CardContent className="space-y-2">
                            <div className="space-y-1">
                                <Label htmlFor="email">Email</Label>
                                <Input id="email" name="email" type="email" placeholder="m@example.com" required />
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="password">Password</Label>
                                <Input id="password" name="password" type="password" required />
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button className="w-full" type="submit" disabled={isLoading}>
                                {isLoading ? 'Logging in...' : 'Login'}
                            </Button>
                        </CardFooter>
                    </form>
                </Card>
            </TabsContent>

            <TabsContent value="signup">
                <Card>
                    <CardHeader>
                        <CardTitle>Sign Up</CardTitle>
                        <CardDescription>
                            Create a new account for your school.
                        </CardDescription>
                    </CardHeader>
                    <form action={handleSignup}>
                        <CardContent className="space-y-2">
                            <div className="space-y-1">
                                <Label htmlFor="fullName">Full Name</Label>
                                <Input id="fullName" name="fullName" placeholder="John Doe" required />
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="schoolName">School Name</Label>
                                <Input id="schoolName" name="schoolName" placeholder="St. Mary's High School" required />
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="signup-email">Email</Label>
                                <Input id="signup-email" name="email" type="email" placeholder="m@example.com" required />
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="signup-password">Password</Label>
                                <Input id="signup-password" name="password" type="password" required />
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button className="w-full" type="submit" disabled={isLoading}>
                                {isLoading ? 'Creating account...' : 'Create Account'}
                            </Button>
                        </CardFooter>
                    </form>
                </Card>
            </TabsContent>
        </Tabs>
    )
}
