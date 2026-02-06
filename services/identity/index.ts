import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
// Removed redundant supabase import - using require('shared') below

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

const { supabase, redis } = require('shared');

// In-memory cache for ultra-fast fallback
const localCache = new Map<string, { data: any, expiry: number }>();

// Helper for caching
async function getCachedActiveYear(school_id: string) {
    const cacheKey = `active_year:${school_id}`;

    // 1. Try In-Memory Cache (5 minute TTL)
    const local = localCache.get(cacheKey);
    if (local && local.expiry > Date.now()) {
        console.log(`[Identity] Memory Cache HIT (${school_id})`);
        return { data: local.data, error: null };
    }

    try {
        // 2. Try Redis Cache (1 hour TTL)
        const cached = await redis.get(cacheKey);
        if (cached) {
            console.log(`[Identity] Redis Cache HIT (${school_id})`);
            const data = JSON.parse(cached);
            localCache.set(cacheKey, { data, expiry: Date.now() + 300000 });
            return { data, error: null };
        }
    } catch (e) {
        console.warn('[Identity] Redis error:', e);
    }

    // 3. Fallback to Supabase
    const start = Date.now();
    const { data, error } = await supabase
        .from('academic_years')
        .select('*')
        .eq('school_id', school_id)
        .eq('is_active', true)
        .single();

    console.log(`[Identity] Supabase fetch took ${Date.now() - start}ms`);

    if (data && !error) {
        // Update caches
        localCache.set(cacheKey, { data, expiry: Date.now() + 300000 });
        try {
            await redis.set(cacheKey, JSON.stringify(data), 'EX', 3600);
        } catch (e) {
            console.warn('[Identity] Redis set error:', e);
        }
    }

    return { data, error };
}

// Get Active Academic Year
app.get('/academic-years/active', async (req, res) => {
    const { school_id } = req.query;
    if (!school_id) return res.status(400).json({ error: 'school_id required' });

    const { data, error } = await getCachedActiveYear(school_id as string);

    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
});

app.get('/health', (req, res) => {
    res.json({ status: 'Identity Service is running' });
});

app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`Identity Service running on http://localhost:${PORT}`);
});
