
import { createClient } from '@/lib/supabase/server'
import { FeeCollectionForm } from './fee-collection-form'



export default async function FeeCollectionPage({
    searchParams,
}: {
    searchParams: { [key: string]: string | string[] | undefined }
}) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return null

    const { data: profile } = await supabase
        .from('user_profiles')
        .select('school_id')
        .eq('id', user.id)
        .single()

    if (!profile?.school_id) return <div>No school linked</div>

    // Fetch Classes and Sections for Filters
    const { data: classes } = await supabase
        .from('classes')
        .select('id, name')
        .eq('school_id', profile.school_id)
        .order('order_index')

    const { data: sections } = await supabase
        .from('sections')
        .select('id, name, class_id')
        .eq('school_id', profile.school_id)
        .order('name')

    // Build Query with Filters
    let query = supabase
        .from('students')
        .select('id, first_name, last_name, admission_no, father_name, class:classes(name), section:sections(name)')
        .eq('school_id', profile.school_id)
        .eq('is_active', true)
        .order('first_name')

    // Apply Filters
    const search = searchParams.search as string
    const classId = searchParams.class_id as string
    const sectionId = searchParams.section_id as string

    if (search) {
        query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,admission_no.ilike.%${search}%`)
    }
    if (classId && classId !== 'all') {
        query = query.eq('current_class_id', classId)
    }
    if (sectionId && sectionId !== 'all') {
        query = query.eq('current_section_id', sectionId)
    }

    const { data: students } = await query

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-2xl font-bold tracking-tight">Fee Collection</h3>
                <p className="text-muted-foreground">
                    Search for a student to collect fees.
                </p>
            </div>

            <FeeCollectionForm
                students={students || []}
                classes={classes || []}
                sections={sections || []}
            />
        </div>
    )
}
