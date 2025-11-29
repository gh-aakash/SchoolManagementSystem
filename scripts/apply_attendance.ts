
import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase credentials')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function applySchema() {
    const schemaPath = path.join(process.cwd(), 'attendance_schema.sql')
    const sql = fs.readFileSync(schemaPath, 'utf8')

    const { error } = await supabase.rpc('exec_sql', { sql_query: sql })

    if (error) {
        console.error('Failed to apply schema via RPC:', error)
        console.log('Please run the SQL in "attendance_schema.sql" manually in your Supabase SQL Editor.')
    } else {
        console.log('Attendance schema applied successfully')
    }
}

applySchema()
