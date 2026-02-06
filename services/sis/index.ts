import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { supabase } from 'shared';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8002;

app.use(cors());
app.use(express.json());

// Get Students by school with filters
app.get('/students', async (req, res) => {
    const { school_id, search, class_id, section_id, gender } = req.query;
    if (!school_id) return res.status(400).json({ error: 'school_id required' });

    let query = supabase
        .from('students')
        .select('*, classes(name), sections(name)')
        .eq('school_id', school_id);

    if (search) {
        query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,admission_no.ilike.%${search}%`);
    }
    if (class_id && class_id !== 'all') {
        query = query.eq('current_class_id', class_id);
    }
    if (section_id && section_id !== 'all') {
        query = query.eq('current_section_id', section_id);
    }
    if (gender && gender !== 'all') {
        query = query.eq('gender', gender);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
});

// Get Student Stats
app.get('/stats', async (req, res) => {
    const { school_id } = req.query;
    const { count, error } = await supabase
        .from('students')
        .select('*', { count: 'exact', head: true })
        .eq('school_id', school_id)
        .eq('is_active', true);

    if (error) return res.status(400).json({ error: error.message });
    res.json({ studentCount: count || 0 });
});

// Helper to get next admission no
async function getNextAdmissionNo(school_id: string) {
    const { data: lastStudent } = await supabase
        .from('students')
        .select('admission_no')
        .eq('school_id', school_id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

    let nextAdmissionNo = 'ADM-00001';
    if (lastStudent?.admission_no) {
        const match = lastStudent.admission_no.match(/ADM-(\d+)/);
        if (match) {
            const nextNum = parseInt(match[1]) + 1;
            nextAdmissionNo = `ADM-${nextNum.toString().padStart(5, '0')}`;
        }
    }
    return nextAdmissionNo;
}

// Create Student
app.post('/students', async (req, res) => {
    const {
        school_id, first_name, last_name, admission_no,
        roll_no, gender, dob, current_class_id,
        current_section_id, academic_year_id
    } = req.body;

    try {
        const start = Date.now();
        let finalAdmissionNo = admission_no;
        if (!finalAdmissionNo) {
            finalAdmissionNo = await getNextAdmissionNo(school_id);
        }
        console.log(`[SIS] Admission No generated in ${Date.now() - start}ms`);

        const insertStart = Date.now();
        const { data, error } = await supabase
            .from('students')
            .insert({
                school_id,
                first_name,
                last_name,
                admission_no: finalAdmissionNo,
                roll_no,
                gender,
                dob,
                current_class_id,
                current_section_id,
                academic_year_id
            })
            .select()
            .single();

        console.log(`[SIS] DB Insert completed in ${Date.now() - insertStart}ms. Total: ${Date.now() - start}ms`);

        if (error) throw error;
        res.json(data);
    } catch (error: any) {
        console.error('SIS Create Student Error:', error);
        res.status(400).json({ error: error.message });
    }
});

// Update Student
app.put('/students/:id', async (req, res) => {
    const { id } = req.params;
    const updates = req.body;
    const { data, error } = await supabase
        .from('students')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
});

// Delete Student
app.delete('/students/:id', async (req, res) => {
    const { id } = req.params;
    const { error } = await supabase
        .from('students')
        .delete()
        .eq('id', id);

    if (error) return res.status(400).json({ error: error.message });
    res.json({ success: true });
});

// Get Next Admission Number
app.get('/students/next-admission-no', async (req, res) => {
    const { school_id } = req.query;
    const { data: lastStudent, error } = await supabase
        .from('students')
        .select('admission_no')
        .eq('school_id', school_id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

    let nextAdmissionNo = 'ADM-00001';
    if (lastStudent?.admission_no) {
        const match = lastStudent.admission_no.match(/ADM-(\d+)/);
        if (match) {
            const nextNum = parseInt(match[1]) + 1;
            nextAdmissionNo = `ADM-${nextNum.toString().padStart(5, '0')}`;
        }
    }

    if (error && error.code !== 'PGRST116') { // PGRST116 is 'no rows found'
        return res.status(400).json({ error: error.message });
    }

    res.json({ nextAdmissionNo });
});

// Get Classes
app.get('/classes', async (req, res) => {
    const { school_id } = req.query;
    const { data, error } = await supabase
        .from('classes')
        .select('*, sections(*)')
        .eq('school_id', school_id)
        .order('order_index');

    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
});

// Get Sections
app.get('/sections', async (req, res) => {
    const { school_id } = req.query;
    const { data, error } = await supabase
        .from('sections')
        .select('*')
        .eq('school_id', school_id)
        .order('name');

    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
});

app.get('/health', (req, res) => {
    res.json({ status: 'SIS Service is running' });
});

app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`SIS Service running on http://localhost:${PORT}`);
});
