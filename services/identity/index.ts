import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { supabase } from 'shared';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8001;

app.use(cors());
app.use(express.json());

// Get User Profile
app.get('/profile/:id', async (req, res) => {
    const { id } = req.params;
    const { data, error } = await supabase
        .from('user_profiles')
        .select('*, schools(*)')
        .eq('id', id)
        .single();

    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
});

// Get Schools
app.get('/schools', async (req, res) => {
    const { data, error } = await supabase
        .from('schools')
        .select('*');

    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
});

// Get Faculty Stats
app.get('/stats', async (req, res) => {
    const { school_id } = req.query;
    const { count, error } = await supabase
        .from('staff')
        .select('*', { count: 'exact', head: true })
        .eq('school_id', school_id)
        .eq('is_active', true);

    if (error) return res.status(400).json({ error: error.message });
    res.json({ staffCount: count || 0 });
});

// Get Faculty List
app.get('/staff', async (req, res) => {
    const { school_id } = req.query;
    const { data, error } = await supabase
        .from('staff')
        .select('*')
        .eq('school_id', school_id)
        .order('first_name');

    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
});

// Create Staff
app.post('/staff', async (req, res) => {
    const { school_id, first_name, last_name, email, phone, qualification, designation, joining_date } = req.body;
    const { data, error } = await supabase
        .from('staff')
        .insert({
            school_id,
            first_name,
            last_name,
            email,
            phone,
            qualification,
            designation,
            joining_date
        })
        .select()
        .single();

    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
});

// Update Staff
app.put('/staff/:id', async (req, res) => {
    const { id } = req.params;
    const updates = req.body;
    const { data, error } = await supabase
        .from('staff')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
});

// Delete Staff
app.delete('/staff/:id', async (req, res) => {
    const { id } = req.params;
    const { error } = await supabase
        .from('staff')
        .delete()
        .eq('id', id);

    if (error) return res.status(400).json({ error: error.message });
    res.json({ success: true });
});

// Get Active Academic Year
app.get('/academic-years/active', async (req, res) => {
    const { school_id } = req.query;
    const { data, error } = await supabase
        .from('academic_years')
        .select('*')
        .eq('school_id', school_id)
        .eq('is_active', true)
        .single();

    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
});

app.get('/health', (req, res) => {
    res.json({ status: 'Identity Service is running' });
});

app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`Identity Service running on http://localhost:${PORT}`);
});
