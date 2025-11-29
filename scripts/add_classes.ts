
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function addClasses() {
    console.log('Fetching schools...')
    const { data: schools } = await supabase.from('schools').select('id, name')

    if (!schools) {
        console.log('No schools found')
        return
    }

    for (const school of schools) {
        console.log(`Processing school: ${school.name}`)

        for (let i = 11; i <= 12; i++) {
            const className = `Class ${i}`

            // Check if exists
            const { data: existing } = await supabase
                .from('classes')
                .select('id')
                .eq('school_id', school.id)
                .eq('name', className)
                .single()

            if (!existing) {
                console.log(`Adding ${className}...`)
                const { data: newClass, error } = await supabase
                    .from('classes')
                    .insert({
                        school_id: school.id,
                        name: className,
                        order_index: i
                    })
                    .select()
                    .single()

                if (error) console.error(error)
                else {
                    // Add Section A
                    await supabase.from('sections').insert({
                        school_id: school.id,
                        class_id: newClass.id,
                        name: 'A'
                    })
                }
            } else {
                console.log(`${className} already exists`)
            }
        }
    }
    console.log('Done!')
}

addClasses()
