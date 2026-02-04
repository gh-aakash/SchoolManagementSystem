
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { AdmissionForm } from '../../add/admission-form'

export default async function EditStudentPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const supabase = await createClient()

    // Fetch student data
    const { data: student } = await supabase
        .from('students')
        .select('*')
        .eq('id', id)
        .single()

    if (!student) return notFound()

    // Fetch classes and sections
    const { data: classes } = await supabase
        .from('classes')
        .select('id, name')
        .eq('school_id', student.school_id)
        .order('order_index')

    const { data: sections } = await supabase
        .from('sections')
        .select('id, name, class_id')
        .eq('school_id', student.school_id)
        .order('name')

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold tracking-tight">Edit Student Profile</h2>
            {/* Reuse AdmissionForm with initial data */}
            <AdmissionForm
                initialData={student}
                isEditMode={true}
                classes={classes || []}
                sections={sections || []}
            />
        </div>
    )
}
