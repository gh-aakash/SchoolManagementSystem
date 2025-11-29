
'use server'

import { Client } from 'pg'
import fs from 'fs'
import path from 'path'

export async function runMigration() {
    const connectionString = process.env.DATABASE_URL
    if (!connectionString) return { error: 'Missing DATABASE_URL' }

    const client = new Client({
        connectionString,
        ssl: { rejectUnauthorized: false }
    })

    try {
        await client.connect()

        // Read schemas
        const attendanceSql = fs.readFileSync(path.join(process.cwd(), 'attendance_schema.sql'), 'utf8')
        // We can also run automations schema if needed, but let's focus on attendance
        // const automationsSql = fs.readFileSync(path.join(process.cwd(), 'automations_schema.sql'), 'utf8')

        await client.query(attendanceSql)
        console.log('Migration successful')
        return { success: true, message: 'Migration applied successfully' }
    } catch (error) {
        console.error('Migration failed:', error)
        return { error: 'Migration failed' }
    } finally {
        await client.end()
    }
}
