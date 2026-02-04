
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { format } from 'date-fns'

export default async function PrintAdmissionFormPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const supabase = await createClient()

    const { data: student } = await supabase
        .from('students')
        .select(`
            *,
            current_class:classes(name),
            current_section:sections(name),
            school:schools(*)
        `)
        .eq('id', id)
        .single()

    if (!student) return notFound()

    const { school } = student

    return (
        <div className="max-w-[210mm] mx-auto p-8 bg-white min-h-screen text-black print:p-0">
            <script
                dangerouslySetInnerHTML={{
                    __html: `window.onload = function() { window.print(); }`
                }}
            />

            {/* Header */}
            <div className="flex items-center justify-between border-b-2 border-black pb-4 mb-6">
                <div className="w-24 h-24 relative">
                    {/* Logo Placeholder */}
                    <div className="w-full h-full border border-gray-300 flex items-center justify-center text-xs text-gray-400">Logo</div>
                </div>
                <div className="text-center flex-1 px-4">
                    <h1 className="text-3xl font-bold uppercase">{school.name}</h1>
                    <p className="text-sm mt-1">{school.address}, {school.city}</p>
                    <p className="text-sm">Affiliation No: {school.affiliation_no || 'N/A'}</p>
                    <div className="mt-2 inline-block bg-black text-white px-6 py-1 font-bold uppercase text-sm">
                        Admission Form
                    </div>
                </div>
                <div className="w-24 h-32 border border-black flex items-center justify-center text-xs text-gray-400">
                    Passport Photo
                </div>
            </div>

            {/* Office Use */}
            <div className="mb-6 border border-black p-2 text-sm flex justify-between bg-gray-50">
                <p><strong>Admission No:</strong> {student.admission_no}</p>
                <p><strong>Date:</strong> {format(new Date(), 'dd/MM/yyyy')}</p>
                <p><strong>Class:</strong> {student.current_class?.name}</p>
            </div>

            {/* Personal Details */}
            <div className="mb-6">
                <h3 className="font-bold border-b border-black mb-4 uppercase text-sm">1. Student Details</h3>
                <div className="grid grid-cols-2 gap-x-8 gap-y-4 text-sm">
                    <div className="flex border-b border-gray-300 pb-1">
                        <span className="w-32 font-semibold">Full Name:</span>
                        <span className="flex-1">{student.first_name} {student.last_name}</span>
                    </div>
                    <div className="flex border-b border-gray-300 pb-1">
                        <span className="w-32 font-semibold">Date of Birth:</span>
                        <span className="flex-1">{student.dob ? format(new Date(student.dob), 'dd/MM/yyyy') : ''}</span>
                    </div>
                    <div className="flex border-b border-gray-300 pb-1">
                        <span className="w-32 font-semibold">Gender:</span>
                        <span className="flex-1">{student.gender}</span>
                    </div>
                    <div className="flex border-b border-gray-300 pb-1">
                        <span className="w-32 font-semibold">Blood Group:</span>
                        <span className="flex-1">{student.blood_group}</span>
                    </div>
                    <div className="flex border-b border-gray-300 pb-1">
                        <span className="w-32 font-semibold">Religion:</span>
                        <span className="flex-1">{student.religion}</span>
                    </div>
                    <div className="flex border-b border-gray-300 pb-1">
                        <span className="w-32 font-semibold">Category:</span>
                        <span className="flex-1">{student.caste_category}</span>
                    </div>
                    <div className="flex border-b border-gray-300 pb-1 col-span-2">
                        <span className="w-32 font-semibold">Aadhar No:</span>
                        <span className="flex-1">{student.aadhar_no}</span>
                    </div>
                </div>
            </div>

            {/* Parent Details */}
            <div className="mb-6">
                <h3 className="font-bold border-b border-black mb-4 uppercase text-sm">2. Parent / Guardian Details</h3>
                <div className="grid grid-cols-2 gap-x-8 gap-y-4 text-sm">
                    <div className="flex border-b border-gray-300 pb-1">
                        <span className="w-32 font-semibold">Father's Name:</span>
                        <span className="flex-1">{student.father_name}</span>
                    </div>
                    <div className="flex border-b border-gray-300 pb-1">
                        <span className="w-32 font-semibold">Mother's Name:</span>
                        <span className="flex-1">{student.mother_name}</span>
                    </div>
                    <div className="flex border-b border-gray-300 pb-1">
                        <span className="w-32 font-semibold">Father's Phone:</span>
                        <span className="flex-1">{student.father_phone}</span>
                    </div>
                    <div className="flex border-b border-gray-300 pb-1">
                        <span className="w-32 font-semibold">Mother's Phone:</span>
                        <span className="flex-1">{student.mother_phone}</span>
                    </div>
                    <div className="flex border-b border-gray-300 pb-1 col-span-2">
                        <span className="w-32 font-semibold">Address:</span>
                        <span className="flex-1">{student.address}, {student.city}, {student.state} - {student.pincode}</span>
                    </div>
                </div>
            </div>

            {/* Declaration */}
            <div className="mt-12 text-sm">
                <h3 className="font-bold border-b border-black mb-4 uppercase">Declaration</h3>
                <p className="mb-8 text-justify leading-relaxed">
                    I hereby declare that the information provided above is true and correct to the best of my knowledge.
                    I agree to abide by the rules and regulations of the school.
                </p>

                <div className="flex justify-between mt-16">
                    <div className="text-center w-48">
                        <p className="border-t border-black pt-2">Parent's Signature</p>
                    </div>
                    <div className="text-center w-48">
                        <p className="border-t border-black pt-2">Principal's Signature</p>
                    </div>
                </div>
            </div>
        </div>
    )
}
