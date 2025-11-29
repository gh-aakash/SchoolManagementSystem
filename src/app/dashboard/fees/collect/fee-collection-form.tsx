'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { collectFee } from '../actions'
import { createRazorpayOrder, verifyRazorpayPayment } from '../razorpay-actions'
import Script from 'next/script'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { Search } from 'lucide-react'

interface FeeCollectionFormProps {
    students: any[]
    classes: any[]
    sections: any[]
}

export function FeeCollectionForm({ students, classes, sections }: FeeCollectionFormProps) {
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()

    const [isLoading, setIsLoading] = useState(false)
    const [selectedStudent, setSelectedStudent] = useState<string>('')

    // Load Razorpay Script
    const [isRazorpayLoaded, setIsRazorpayLoaded] = useState(false)

    // Filter States
    const [search, setSearch] = useState(searchParams.get('search') || '')
    const [classId, setClassId] = useState(searchParams.get('class_id') || 'all')
    const [sectionId, setSectionId] = useState(searchParams.get('section_id') || 'all')

    // Filter sections based on selected class
    const filteredSections = classId && classId !== 'all'
        ? sections.filter(s => s.class_id === classId)
        : []

    // Update URL when filters change
    function applyFilters(newSearch: string, newClassId: string, newSectionId: string) {
        const params = new URLSearchParams()
        if (newSearch) params.set('search', newSearch)
        if (newClassId && newClassId !== 'all') params.set('class_id', newClassId)
        if (newSectionId && newSectionId !== 'all') params.set('section_id', newSectionId)

        router.replace(`${pathname}?${params.toString()}`)
    }

    // Handlers
    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearch(e.target.value)
        // Debounce could be added here, but for now enter key or blur is fine, 
        // or we can just update on change if we want instant feedback (might be too many requests)
        // Let's stick to "Enter" or a specific effect for now, or just pass it to applyFilters on blur/enter.
    }

    const handleClassChange = (val: string) => {
        setClassId(val)
        setSectionId('all') // Reset section when class changes
        applyFilters(search, val, 'all')
    }

    const handleSectionChange = (val: string) => {
        setSectionId(val)
        applyFilters(search, classId, val)
    }

    const handleSearchSubmit = () => {
        applyFilters(search, classId, sectionId)
    }

    async function handleOnlinePayment(formData: FormData) {
        if (!isRazorpayLoaded) {
            toast.error('Payment gateway not loaded. Please refresh.')
            return
        }

        const amount = Number(formData.get('amount'))
        if (!amount || amount <= 0) {
            toast.error('Invalid amount')
            return
        }

        setIsLoading(true)

        // 1. Create Order
        const orderResult = await createRazorpayOrder(amount, `receipt_${Date.now()}`)
        if (orderResult.error || !orderResult.orderId) {
            toast.error(orderResult.error || 'Failed to create order')
            setIsLoading(false)
            return
        }

        // 2. Open Razorpay Checkout
        const options = {
            key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
            amount: orderResult.amount,
            currency: orderResult.currency,
            name: 'SchoolOS',
            description: 'Fee Payment',
            order_id: orderResult.orderId,
            handler: async function (response: any) {
                // 3. Verify Payment
                const verifyResult = await verifyRazorpayPayment(
                    response.razorpay_order_id,
                    response.razorpay_payment_id,
                    response.razorpay_signature
                )

                if (verifyResult.success) {
                    // 4. Record Payment in DB (Call existing collectFee but with transaction ID)
                    formData.append('transaction_id', response.razorpay_payment_id)
                    formData.append('payment_mode', 'Online') // Force mode to Online

                    const dbResult = await collectFee(formData)
                    if (dbResult?.error) {
                        toast.error('Payment successful but failed to record. Contact Admin.')
                    } else {
                        toast.success('Fee collected successfully')
                        // Redirect to receipt
                        if (dbResult.data?.id) {
                            router.push(`/dashboard/fees/receipt/${dbResult.data.id}`)
                        }
                    }
                } else {
                    toast.error('Payment verification failed')
                }
                setIsLoading(false)
            },
            prefill: {
                name: student?.first_name + ' ' + student?.last_name,
                contact: '9999999999', // Should come from student data
                email: 'student@example.com' // Should come from student data
            },
            theme: {
                color: '#3399cc'
            },
            modal: {
                ondismiss: function () {
                    setIsLoading(false)
                    toast.error('Payment cancelled')
                }
            }
        }

        const rzp1 = new (window as any).Razorpay(options)
        rzp1.on('payment.failed', function (response: any) {
            toast.error(response.error.description)
            setIsLoading(false)
        })
        rzp1.open()
    }

    async function handleSubmit(formData: FormData) {
        const mode = formData.get('payment_mode')

        if (mode === 'Online') {
            await handleOnlinePayment(formData)
        } else {
            // Existing logic for Cash/Cheque
            setIsLoading(true)
            const result = await collectFee(formData)
            setIsLoading(false)

            if (result?.error) {
                toast.error(result.error)
            } else {
                toast.success('Fee collected successfully')
                // Redirect to receipt
                if (result.data?.id) {
                    router.push(`/dashboard/fees/receipt/${result.data.id}`)
                }
            }
        }
    }

    const student = students.find(s => s.id === selectedStudent)

    return (
        <>
            <Script
                id="razorpay-checkout-js"
                src="https://checkout.razorpay.com/v1/checkout.js"
                onLoad={() => setIsRazorpayLoaded(true)}
            />
            <Card className="max-w-3xl mx-auto">
                <CardHeader>
                    <CardTitle>Collect Fees</CardTitle>
                    <CardDescription>Search and select a student to record fee payment.</CardDescription>
                </CardHeader>

                <CardContent className="space-y-6">
                    {/* Filters Section */}
                    <div className="grid gap-4 md:grid-cols-3 p-4 bg-muted/50 rounded-lg border">
                        <div className="space-y-2">
                            <Label className="text-xs font-medium text-muted-foreground">Filter by Class</Label>
                            <Select value={classId} onValueChange={handleClassChange}>
                                <SelectTrigger className="bg-background">
                                    <SelectValue placeholder="All Classes" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Classes</SelectItem>
                                    {classes.map((c) => (
                                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs font-medium text-muted-foreground">Filter by Section</Label>
                            <Select value={sectionId} onValueChange={handleSectionChange} disabled={!classId || classId === 'all'}>
                                <SelectTrigger className="bg-background">
                                    <SelectValue placeholder="All Sections" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Sections</SelectItem>
                                    {filteredSections.map((s) => (
                                        <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs font-medium text-muted-foreground">Search Student</Label>
                            <div className="relative">
                                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Name or Adm No..."
                                    className="pl-8 bg-background"
                                    value={search}
                                    onChange={handleSearchChange}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSearchSubmit()}
                                    onBlur={handleSearchSubmit}
                                />
                            </div>
                        </div>
                    </div>

                    <form action={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="student_id">Select Student</Label>
                            <Select name="student_id" value={selectedStudent} onValueChange={setSelectedStudent} required>
                                <SelectTrigger>
                                    <SelectValue placeholder={students.length > 0 ? "Select a student..." : "No students found"} />
                                </SelectTrigger>
                                <SelectContent>
                                    {students.map((s) => (
                                        <SelectItem key={s.id} value={s.id}>
                                            {s.first_name} {s.last_name} ({s.admission_no}) - {s.class?.name} {s.section?.name}
                                        </SelectItem>
                                    ))}
                                    {students.length === 0 && (
                                        <div className="p-2 text-sm text-muted-foreground text-center">
                                            No students match the filters.
                                        </div>
                                    )}
                                </SelectContent>
                            </Select>
                        </div>

                        {student && (
                            <div className="rounded-md border bg-card p-4 text-sm space-y-2 shadow-sm">
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <span className="text-muted-foreground">Admission No:</span>
                                        <p className="font-medium">{student.admission_no}</p>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground">Father's Name:</span>
                                        <p className="font-medium">{student.father_name}</p>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground">Class:</span>
                                        <p className="font-medium">{student.class?.name} - {student.section?.name}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="amount">Amount (₹)</Label>
                                <Input id="amount" name="amount" type="number" required placeholder="0.00" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="payment_mode">Payment Mode</Label>
                                <Select name="payment_mode" defaultValue="Cash" required>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Cash">Cash</SelectItem>
                                        <SelectItem value="Online">Online (Razorpay)</SelectItem>
                                        <SelectItem value="Cheque">Cheque</SelectItem>
                                        <SelectItem value="UPI">UPI (Manual)</SelectItem>
                                        <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="remarks">Remarks</Label>
                            <Input id="remarks" name="remarks" placeholder="Optional transaction details..." />
                        </div>

                        <Button type="submit" className="w-full" disabled={isLoading || !selectedStudent}>
                            {isLoading ? 'Processing...' : 'Collect Fee'}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </>
    )
}
