import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { supabase } from 'shared';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8005;

app.use(cors());
app.use(express.json());

// Get Timetable
app.get('/timetable/:sectionId', async (req, res) => {
    const { sectionId } = req.params;
    const { data, error } = await supabase
        .from('timetable')
        .select('*, subjects(name), staff(first_name, last_name)')
        .eq('section_id', sectionId);

    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
});

// Subjects
app.get('/subjects', async (req, res) => {
    const { school_id } = req.query;
    const { data, error } = await supabase.from('subjects').select('*').eq('school_id', school_id);
    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
});

app.post('/subjects', async (req, res) => {
    const { school_id, name, code, type } = req.body;
    const { data, error } = await supabase.from('subjects').insert({ school_id, name, code, type }).select().single();
    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
});

// Exams
app.post('/exams', async (req, res) => {
    const { school_id, academic_year_id, name, start_date, end_date } = req.body;
    const { data, error } = await supabase.from('exams').insert({ school_id, academic_year_id, name, start_date, end_date }).select().single();
    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
});

// Exam Results
app.post('/exam-results/upsert', async (req, res) => {
    const { updates } = req.body;
    const { error } = await supabase.from('exam_results').upsert(updates, { onConflict: 'student_id, exam_id, subject_id' });
    if (error) return res.status(400).json({ error: error.message });
    res.json({ success: true });
});

// Periods
app.post('/periods', async (req, res) => {
    const { school_id, name, start_time, end_time } = req.body;
    const { data, error } = await supabase.from('class_periods').insert({ school_id, name, start_time, end_time }).select().single();
    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
});

// Timetable Save with conflict check
app.post('/timetable/save', async (req, res) => {
    const { school_id, section_id, entries } = req.body;

    // Check for conflicts
    for (const entry of entries) {
        if (!entry.teacher_id) continue;
        const { data: conflict } = await supabase
            .from('timetable')
            .select('classes(name), sections(name)')
            .eq('school_id', school_id)
            .eq('day_of_week', entry.day_of_week)
            .eq('period_id', entry.period_id)
            .eq('teacher_id', entry.teacher_id)
            .neq('section_id', section_id)
            .maybeSingle();

        if (conflict) {
            const c = conflict as any;
            return res.status(409).json({
                error: `Conflict: Teacher is already assigned to ${c.classes?.name} - ${c.sections?.name} at this time.`
            });
        }
    }

    const upsertData = entries.map((e: any) => ({
        school_id,
        class_id: e.class_id,
        section_id,
        day_of_week: e.day_of_week,
        period_id: e.period_id,
        subject_id: e.subject_id || null,
        teacher_id: e.teacher_id || null
    }));

    const { error } = await supabase.from('timetable').upsert(upsertData, { onConflict: 'section_id, day_of_week, period_id' });
    if (error) return res.status(400).json({ error: error.message });
    res.json({ success: true });
});

// Master Timetable
app.get('/timetable/master', async (req, res) => {
    const { school_id, day_of_week } = req.query;
    const { data, error } = await supabase
        .from('timetable')
        .select(`
            *,
            classes(name),
            sections(name),
            subjects(name),
            staff(first_name, last_name)
        `)
        .eq('school_id', school_id)
        .eq('day_of_week', day_of_week);

    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
});

app.get('/health', (req, res) => {
    res.json({ status: 'Academic Service is running' });
});

app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`Academic Service running on http://localhost:${PORT}`);
});
