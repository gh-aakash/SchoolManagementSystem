
'use client'

import { Button } from '@/components/ui/button'
import { Printer } from 'lucide-react'
import Image from 'next/image'
import { useRef } from 'react'
import { useReactToPrint } from 'react-to-print'

interface IDCardProps {
    student: any
    school: any
}

export function IDCard({ student, school }: IDCardProps) {
    const componentRef = useRef(null)
    const handlePrint = useReactToPrint({
        content: () => componentRef.current,
    })

    return (
        <div>
            <Button onClick={handlePrint} variant="outline" className="gap-2">
                <Printer className="h-4 w-4" />
                Print ID Card
            </Button>

            {/* Hidden Print Content */}
            <div style={{ display: 'none' }}>
                <div ref={componentRef} className="w-[85.6mm] h-[53.98mm] border border-gray-300 bg-white relative overflow-hidden print:block mx-auto">
                    {/* Background Design */}
                    <div className="absolute top-0 left-0 w-full h-16 bg-blue-600"></div>

                    <div className="relative z-10 p-4 h-full flex flex-col items-center">
                        {/* School Logo/Name */}
                        <div className="text-white text-center mb-2">
                            <h2 className="text-xs font-bold uppercase tracking-wider">{school.name}</h2>
                            <p className="text-[8px] opacity-90">{school.city}</p>
                        </div>

                        {/* Photo */}
                        <div className="w-16 h-16 rounded-full border-2 border-white bg-gray-200 overflow-hidden mb-2">
                            {student.photo_url ? (
                                <img src={student.photo_url} alt="Student" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">No Photo</div>
                            )}
                        </div>

                        {/* Student Details */}
                        <div className="text-center w-full">
                            <h3 className="font-bold text-sm text-gray-800">{student.first_name} {student.last_name}</h3>
                            <p className="text-xs text-blue-600 font-semibold">Class: {student.current_class?.name} - {student.current_section?.name}</p>

                            <div className="mt-2 grid grid-cols-2 gap-x-2 text-[9px] text-left w-full px-4">
                                <p><span className="font-bold text-gray-500">Adm No:</span> {student.admission_no}</p>
                                <p><span className="font-bold text-gray-500">DOB:</span> {student.dob ? new Date(student.dob).toLocaleDateString('en-IN') : 'N/A'}</p>
                                <p><span className="font-bold text-gray-500">Blood:</span> {student.blood_group || 'N/A'}</p>
                                <p><span className="font-bold text-gray-500">Phone:</span> {student.father_phone}</p>
                            </div>
                        </div>

                        {/* Footer Bar */}
                        <div className="absolute bottom-0 left-0 w-full h-6 bg-gray-100 flex items-center justify-center border-t">
                            <p className="text-[8px] text-gray-500">Principal Signature</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
