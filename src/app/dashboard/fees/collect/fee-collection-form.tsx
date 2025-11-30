'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { collectFee, getStudentPendingFees } from '../actions'
import { createRazorpayOrder, verifyRazorpayPayment } from '../razorpay-actions'
import Script from 'next/script'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'
import { Search, Loader2 } from 'lucide-react'
import { format } from 'date-fns'

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

    // Pending Fees State
    const [pendingFees, setPendingFees] = useState<any[]>([])
    const [selectedFeeIds, setSelectedFeeIds] = useState<string[]>([])
    const [isFetchingFees, setIsFetchingFees] = useState(false)
    const [amount, setAmount] = useState<string>('')

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

    // Fetch Pending Fees when student changes
    useEffect(() => {
        if (selectedStudent) {
            fetchPendingFees(selectedStudent)
        } else {
            setPendingFees([])
            setSelectedFeeIds([])
            setAmount('')
        }
    }, [selectedStudent])

    // Initialize from URL Params
    useEffect(() => {
        const paramStudentId = searchParams.get('studentId')
        if (paramStudentId && paramStudentId !== selectedStudent) {
            setSelectedStudent(paramStudentId)
        }
    }, [searchParams])

    async function fetchPendingFees(studentId: string) {
        setIsFetchingFees(true)
        const result = await getStudentPendingFees(studentId)
        setIsFetchingFees(false)
        if (result?.data) {
            setPendingFees(result.data)

            // Check for feeId in URL to auto-select
            const paramFeeId = searchParams.get('feeId')
            if (paramFeeId) {
                const fee = result.data.find((f: any) => f.id === paramFeeId)
                if (fee) {
                    const balance = fee.amount_due - (fee.amount_paid || 0)
                    setSelectedFeeIds([fee.id])
                    setAmount(balance.toString())
                }
            } else {
                setSelectedFeeIds([])
                setAmount('')
            }
        } else if (result?.error) {
            toast.error(result.error)
        }
    }

    // Handle Fee Selection
    function toggleFeeSelection(feeId: string, balance: number) {
        setSelectedFeeIds(prev => {
            const newSelection = prev.includes(feeId)
                ? prev.filter(id => id !== feeId)
                : [...prev, feeId]

            // Recalculate Amount
            const total = pendingFees
                .filter(f => newSelection.includes(f.id))
                .reduce((sum, f) => sum + (f.amount_due - (f.amount_paid || 0)), 0)

            setAmount(total > 0 ? total.toString() : '')

            return newSelection
        })
    }

    function handleSelectAll() {
        if (selectedFeeIds.length === pendingFees.length) {
            setSelectedFeeIds([])
            setAmount('')
        } else {
            const allIds = pendingFees.map(f => f.id)
            setSelectedFeeIds(allIds)
            const total = pendingFees.reduce((sum, f) => sum + (f.amount_due - (f.amount_paid || 0)), 0)
            setAmount(total.toString())
        }
    }

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

        const payAmount = Number(formData.get('amount'))
        if (!payAmount || payAmount <= 0) {
            toast.error('Invalid amount')
            return
        }

        setIsLoading(true)

        // 1. Create Order
        const orderResult = await createRazorpayOrder(payAmount, `receipt_${Date.now()}`)
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
                    // 4. Record Payment in DB
                    formData.append('transaction_id', response.razorpay_payment_id)
                    formData.append('payment_mode', 'Online')
                    if (selectedFeeIds.length > 0) {
                        formData.append('selected_fee_ids', JSON.stringify(selectedFeeIds))
                    }

                    const dbResult = await collectFee(formData)
                    if (dbResult?.error) {
                        toast.error('Payment successful but failed to record. Contact Admin.')
                    } else {
                        toast.success('Fee collected successfully')
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
                contact: '9999999999',
                email: 'student@example.com'
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

        if (selectedFeeIds.length > 0) {
            formData.append('selected_fee_ids', JSON.stringify(selectedFeeIds))
        }

        if (mode === 'Online') {
            await handleOnlinePayment(formData)
        } else {
            setIsLoading(true)
            const result = await collectFee(formData)
            setIsLoading(false)

            if (result?.error) {
                toast.error(result.error)
            } else {
                toast.success('Fee collected successfully')
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
            <Card className="max-w-4xl mx-auto">
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

                        {/* Pending Fees Table */}
                        {student && (
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <Label>Pending Fees</Label>
                                    {isFetchingFees && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                                </div>

                                {pendingFees.length > 0 ? (
                                    <div className="rounded-md border">
                                        <div className="grid grid-cols-[auto_1fr_1fr_1fr_1fr] gap-4 p-3 bg-muted/50 text-xs font-medium text-muted-foreground border-b">
                                            <Checkbox
                                                checked={selectedFeeIds.length === pendingFees.length && pendingFees.length > 0}
                                                onCheckedChange={handleSelectAll}
                                            />
                                            <div>Fee Head</div>
                                            <div>Due Date</div>
                                            <div className="text-right">Balance</div>
                                            <div className="text-right">Status</div>
                                        </div>
                                        <div className="max-h-[200px] overflow-y-auto">
                                            {pendingFees.map((fee) => {
                                                const balance = fee.amount_due - (fee.amount_paid || 0)
                                                return (
                                                    <div key={fee.id} className="grid grid-cols-[auto_1fr_1fr_1fr_1fr] gap-4 p-3 items-center text-sm border-b last:border-0 hover:bg-muted/20 transition-colors">
                                                        <Checkbox
                                                            checked={selectedFeeIds.includes(fee.id)}
                                                            onCheckedChange={() => toggleFeeSelection(fee.id, balance)}
                                                        />
                                                        <div className="font-medium">{fee.fee_structure?.fee_head?.name}</div>
                                                        <div className="text-muted-foreground text-xs">
                                                            {fee.fee_structure?.due_date ? format(new Date(fee.fee_structure.due_date), 'dd MMM yyyy') : '-'}
                                                        </div>
                                                        <div className="text-right font-medium">₹{balance.toLocaleString('en-IN')}</div>
                                                        <div className="text-right">
                                                            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${fee.status === 'partial' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                                                                }`}>
                                                                {fee.status === 'partial' ? 'Partial' : 'Pending'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                        <div className="p-3 bg-muted/20 text-sm flex justify-between items-center font-medium">
                                            <span>Total Selected:</span>
                                            <span>₹{amount || '0'}</span>
                                        </div>
                                    </div>
                                ) : (
                                    !isFetchingFees && (
                                        <div className="p-8 text-center border rounded-md border-dashed text-muted-foreground text-sm">
                                            No pending fees found for this student.
                                        </div>
                                    )
                                )}
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="amount">Amount to Pay (₹)</Label>
                                <Input
                                    id="amount"
                                    name="amount"
                                    type="number"
                                    required
                                    placeholder="0.00"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                />
                                <p className="text-[10px] text-muted-foreground">
                                    {selectedFeeIds.length > 0 ? "Adjust amount for partial payment of selected fees." : "Enter amount to pay oldest dues first."}
                                </p>
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
