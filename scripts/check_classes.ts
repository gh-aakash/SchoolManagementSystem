
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function listClasses() {
    console.log('Listing classes...')
    const { data: schools } = await supabase.from('schools').select('id, name')

    if (!schools) {
        console.log('No schools found')
        return
    }

    for (const school of schools) {
        console.log(`School: ${school.name} (${school.id})`)
        const { data: classes } = await supabase
            .from('classes')
            .select('name, order_index')
            .eq('school_id', school.id)
            .order('order_index')

        if (classes) {
            classes.forEach(c => console.log(` - ${c.name} (Order: ${c.order_index})`))
        } else {
            console.log(' - No classes found')
        }
    }
}

listClasses()
