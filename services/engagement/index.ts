import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { supabase } from 'shared';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8004;

app.use(cors());
app.use(express.json());

// Get Students with Attendance for a date
app.get('/attendance/students', async (req, res) => {
    const { school_id, class_id, section_id, date } = req.query;

    // 1. Fetch Students from SIS (Direct DB query for now)
    const { data: students, error: sError } = await supabase
        .from('students')
        .select('id, first_name, last_name, roll_no, father_phone, mother_phone')
        .eq('school_id', school_id)
        .eq('current_class_id', class_id)
        .eq('current_section_id', section_id)
        .eq('is_active', true)
        .order('roll_no', { ascending: true });

    if (sError) return res.status(400).json({ error: sError.message });

    // 2. Fetch Attendance
    const { data: attendance } = await supabase
        .from('attendance')
        .select('student_id, status')
        .eq('school_id', school_id)
        .eq('date', date)
        .in('student_id', students.map(s => s.id));

    // 3. Merge
    const merged = students.map(s => {
        const record = attendance?.find(a => a.student_id === s.id);
        return { ...s, attendance_status: record?.status };
    });

    res.json(merged);
});

// Mark Attendance (Bulk Upsert)
app.post('/attendance/mark', async (req, res) => {
    const { school_id, records, class_id, section_id } = req.body;

    const upsertData = records.map((r: any) => ({
        school_id,
        student_id: r.student_id,
        class_id,
        section_id,
        date: r.date,
        status: r.status
    }));

    const { error } = await supabase
        .from('attendance')
        .upsert(upsertData, { onConflict: 'student_id, date' });

    if (error) return res.status(400).json({ error: error.message });
    res.json({ success: true });
});

// Get Master Attendance Records
app.get('/attendance/master', async (req, res) => {
    const { school_id, date, class_id, section_id, status } = req.query;

    let query = supabase
        .from('attendance')
        .select(`
            *,
            students (
                first_name,
                last_name,
                admission_no,
                classes(name),
                sections(name)
            )
        `)
        .eq('school_id', school_id)
        .eq('date', date);

    if (class_id && class_id !== 'all') query = query.eq('class_id', class_id);
    if (section_id && section_id !== 'all') query = query.eq('section_id', section_id);
    if (status && status !== 'all') query = query.eq('status', status);

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
});

app.get('/health', (req, res) => {
    res.json({ status: 'Engagement Service is running' });
});

app.listen(PORT, () => {
    console.log(`Engagement Service running on http://localhost:${PORT}`);
});
