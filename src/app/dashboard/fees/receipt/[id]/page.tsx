
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { format } from 'date-fns'

export default async function FeeReceiptPage({ params }: { params: { id: string } }) {
    const supabase = createClient()
    const { id } = params

    // Fetch Transaction Details with related data
    const { data: transaction } = await supabase
        .from('fee_transactions')
        .select(`
            *,
            student:students (
                first_name,
                last_name,
                admission_no,
                current_class:classes(name),
                current_section:sections(name),
                father_name
            ),
            school:schools (
                name,
                address,
                city,
                state,
                pincode,
                phone,
                email,
                logo_url
            )
        `)
        .eq('id', id)
        .single()

    if (!transaction) {
        return notFound()
    }

    const { student, school } = transaction

    return (
        <div className="max-w-[210mm] mx-auto p-8 bg-white min-h-screen text-black print:p-0">
            {/* Print Trigger */}
            <script
                dangerouslySetInnerHTML={{
                    __html: `window.onload = function() { window.print(); }`
                }}
            />

            {/* Header */}
            <div className="text-center border-b-2 border-black pb-4 mb-6">
                <h1 className="text-3xl font-bold uppercase tracking-wider">{school.name}</h1>
                <p className="text-sm mt-1">
                    {school.address}, {school.city}, {school.state} - {school.pincode}
                </p>
                <p className="text-sm">
                    Phone: {school.phone} | Email: {school.email}
                </p>
                <div className="mt-4 inline-block border border-black px-4 py-1 rounded font-semibold">
                    FEE RECEIPT
                </div>
            </div>

            {/* Receipt Info */}
            <div className="flex justify-between mb-6 text-sm">
                <div>
                    <p><strong>Receipt No:</strong> {transaction.id.slice(0, 8).toUpperCase()}</p>
                    <p><strong>Date:</strong> {format(new Date(transaction.payment_date), 'dd/MM/yyyy')}</p>
                </div>
                <div className="text-right">
                    <p><strong>Session:</strong> 2025-2026</p> {/* TODO: Fetch dynamic session */}
                    <p><strong>Payment Mode:</strong> {transaction.payment_mode}</p>
                    {transaction.reference_no && <p><strong>Ref No:</strong> {transaction.reference_no}</p>}
                </div>
            </div>

            {/* Student Details */}
            <div className="mb-6 p-4 border border-black rounded-sm text-sm">
                <div className="grid grid-cols-2 gap-4">
                    <p><strong>Admission No:</strong> {student.admission_no}</p>
                    <p><strong>Class:</strong> {student.current_class?.name} - {student.current_section?.name}</p>
                    <p><strong>Student Name:</strong> {student.first_name} {student.last_name}</p>
                    <p><strong>Father's Name:</strong> {student.father_name}</p>
                </div>
            </div>

            {/* Payment Details Table */}
            <table className="w-full border-collapse border border-black mb-6 text-sm">
                <thead>
                    <tr className="bg-gray-100">
                        <th className="border border-black p-2 text-left">Description</th>
                        <th className="border border-black p-2 text-right w-32">Amount (₹)</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td className="border border-black p-2">School Fees</td>
                        <td className="border border-black p-2 text-right">{transaction.amount.toFixed(2)}</td>
                    </tr>
                    {/* Add more rows if we have breakdown */}
                    <tr className="font-bold">
                        <td className="border border-black p-2 text-right">Total Paid</td>
                        <td className="border border-black p-2 text-right">{transaction.amount.toFixed(2)}</td>
                    </tr>
                </tbody>
            </table>

            {/* Footer */}
            <div className="flex justify-between mt-12 text-sm">
                <div className="text-center">
                    <p className="border-t border-black px-8 pt-1">Accountant</p>
                </div>
                <div className="text-center">
                    <p className="border-t border-black px-8 pt-1">Authorized Signatory</p>
                </div>
            </div>

            <div className="mt-8 text-center text-xs text-gray-500">
                <p>This is a computer-generated receipt.</p>
            </div>
        </div>
    )
}
