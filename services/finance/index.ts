import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { supabase } from 'shared';
import Razorpay from 'razorpay';
import crypto from 'crypto';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8003;

const razorpay = new Razorpay({
    key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
    key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

app.use(cors());
app.use(express.json());

// Get Student Fees
app.get('/student-fees/:studentId', async (req, res) => {
    const { studentId } = req.params;
    const { data, error } = await supabase
        .from('student_fees')
        .select('*, fee_structure:fee_structures(*, fee_head:fee_heads(name))')
        .eq('student_id', studentId);

    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
});

// Record Transaction (Placeholder)
app.post('/transactions', async (req, res) => {
    const { school_id, student_id, amount, payment_mode } = req.body;
    const { data, error } = await supabase
        .from('fee_transactions')
        .insert({ school_id, student_id, amount, payment_mode })
        .select()
        .single();

    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
});

// Get Finance Stats
app.get('/stats', async (req, res) => {
    const { school_id } = req.query;

    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString();

    // 1. Today's Collection
    const { data: todayPayments } = await supabase
        .from('fee_transactions')
        .select('amount')
        .eq('school_id', school_id)
        .gte('payment_date', today);

    const todaysCollection = todayPayments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;

    // 2. Monthly Collection
    const { data: monthlyPayments, error: pError } = await supabase
        .from('fee_transactions')
        .select('amount')
        .eq('school_id', school_id)
        .gte('payment_date', startOfMonth)
        .lte('payment_date', endOfMonth);

    const monthlyCollection = monthlyPayments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;

    // 3. Total Pending
    const { data: pendingFees, error: fError } = await supabase
        .from('student_fees')
        .select('amount_due, amount_paid')
        .eq('school_id', school_id)
        .neq('status', 'paid');

    const totalPending = pendingFees?.reduce((sum, f) => {
        const due = Number(f.amount_due) || 0;
        const paid = Number(f.amount_paid) || 0;
        return sum + (due - paid);
    }, 0) || 0;

    if (pError || fError) return res.status(400).json({ error: (pError || fError)?.message });

    res.json({ todaysCollection, monthlyCollection, totalPending });
});

// Get Recent Transactions
app.get('/recent-transactions', async (req, res) => {
    const { school_id, limit = 5 } = req.query;
    const { data: transactions, error } = await supabase
        .from('fee_transactions')
        .select(`
            id,
            amount,
            payment_date,
            payment_mode,
            students (
                first_name,
                last_name,
                admission_no,
                classes (name)
            )
        `)
        .eq('school_id', school_id)
        .order('payment_date', { ascending: false })
        .limit(Number(limit));

    if (error) return res.status(400).json({ error: error.message });
    res.json({ transactions });
});

// Create Fee Head
app.post('/fee-heads', async (req, res) => {
    const { school_id, name, description, amount } = req.body;
    const { data, error } = await supabase
        .from('fee_heads')
        .insert({ school_id, name, description, amount })
        .select()
        .single();

    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
});

// Create Fee Structure
app.post('/fee-structures', async (req, res) => {
    const { school_id, name, items } = req.body; // items: [{ head_id, amount }]

    const { data: structure, error: sError } = await supabase
        .from('fee_structures')
        .insert({ school_id, name })
        .select()
        .single();

    if (sError) return res.status(400).json({ error: sError.message });

    const structureItems = items.map((item: any) => ({
        structure_id: structure.id,
        fee_head_id: item.head_id,
        amount: item.amount
    }));

    const { error: iError } = await supabase
        .from('fee_structure_items')
        .insert(structureItems);

    if (iError) return res.status(400).json({ error: iError.message });
    res.json(structure);
});

// Collect Fee with Distribution Logic
app.post('/collect-fee', async (req, res) => {
    const { school_id, student_id, amount, payment_mode, remarks, selected_fee_ids } = req.body;

    // 1. Record Transaction
    const { data: transaction, error: tError } = await supabase
        .from('fee_transactions')
        .insert({
            school_id,
            student_id,
            amount: parseFloat(amount),
            payment_mode,
            remarks,
            payment_date: new Date().toISOString()
        })
        .select()
        .single();

    if (tError) return res.status(400).json({ error: tError.message });

    // 2. Fetch Pending Fees
    let query = supabase
        .from('student_fees')
        .select('*, fee_structure:fee_structures(due_date)')
        .eq('student_id', student_id)
        .neq('status', 'paid');

    if (selected_fee_ids && selected_fee_ids.length > 0) {
        query = query.in('id', selected_fee_ids);
    }

    const { data: studentFees, error: fError } = await query;
    if (fError) return res.status(400).json({ error: fError.message });

    // 3. Distribution Logic (FIFO)
    const sortedFees = studentFees?.sort((a: any, b: any) => {
        const dateA = new Date(a.fee_structure?.due_date || 0).getTime();
        const dateB = new Date(b.fee_structure?.due_date || 0).getTime();
        return dateA - dateB;
    });

    if (sortedFees && sortedFees.length > 0) {
        let remainingPayment = parseFloat(amount);

        for (const fee of sortedFees) {
            if (remainingPayment <= 0) break;

            const due = fee.amount_due - (fee.amount_paid || 0);
            const payAmount = Math.min(remainingPayment, due);

            const newPaid = (fee.amount_paid || 0) + payAmount;
            const newStatus = newPaid >= fee.amount_due ? 'paid' : 'partial';

            await supabase
                .from('student_fees')
                .update({
                    amount_paid: newPaid,
                    status: newStatus
                })
                .eq('id', fee.id);

            remainingPayment -= payAmount;
        }
    }

    // Return the transaction
    res.json(transaction);
});
// Create Batch Fee Structures (Recurring)
app.post('/fee-structures/batch', async (req, res) => {
    const { school_id, class_ids, fee_head_id, academic_year_id, amount, frequency, months, due_date } = req.body;

    // This replicates the logic from the monolith
    const feeStructures = [];
    for (const classId of class_ids) {
        if (frequency === 'monthly') {
            for (const monthStr of months) {
                const month = parseInt(monthStr);
                // Simplified due date logic for now
                const due = new Date();
                due.setMonth(month - 1);
                due.setDate(10);

                feeStructures.push({
                    school_id,
                    class_id: classId,
                    fee_head_id,
                    academic_year_id,
                    amount: parseFloat(amount),
                    due_date: due.toISOString().split('T')[0]
                });
            }
        } else {
            feeStructures.push({
                school_id,
                class_id: classId,
                fee_head_id,
                academic_year_id,
                amount: parseFloat(amount),
                due_date: due_date
            });
        }
    }

    const { data: created, error } = await supabase
        .from('fee_structures')
        .insert(feeStructures)
        .select();

    if (error) return res.status(400).json({ error: error.message });
    res.json(created);
});

// Assign Fees to Students
app.post('/assign-fees', async (req, res) => {
    const { school_id, structure_ids, class_id } = req.body;

    // 1. Fetch Students (In a real setup, this might be an internal API call to SIS service)
    // For now, since they share the DB, we can just query the students table
    const { data: students, error: sError } = await supabase
        .from('students')
        .select('id')
        .eq('school_id', school_id)
        .eq('current_class_id', class_id)
        .eq('is_active', true);

    if (sError) return res.status(400).json({ error: sError.message });

    const studentFees: any[] = [];
    for (const structureId of structure_ids) {
        const { data: structure } = await supabase.from('fee_structures').select('*').eq('id', structureId).single();
        if (structure && students) {
            students.forEach(student => {
                studentFees.push({
                    school_id,
                    student_id: student.id,
                    fee_structure_id: structure.id,
                    amount_due: structure.amount,
                    amount_paid: 0,
                    status: 'pending'
                });
            });
        }
    }

    const { error: fError } = await supabase.from('student_fees').insert(studentFees);
    if (fError) return res.status(400).json({ error: fError.message });

    res.json({ success: true, assignedCount: studentFees.length });
});
// Delete Fee Structure
app.delete('/fee-structures/:id', async (req, res) => {
    const { id } = req.params;
    const { error } = await supabase
        .from('fee_structures')
        .delete()
        .eq('id', id);

    if (error) return res.status(400).json({ error: error.message });
    res.json({ success: true });
});

// Sync Fee Structure (Assign to new students)
app.post('/fee-structures/:id/sync', async (req, res) => {
    const { id } = req.params;
    const { school_id } = req.body;

    const { data: structure, error: sError } = await supabase
        .from('fee_structures')
        .select('*')
        .eq('id', id)
        .single();

    if (sError || !structure) return res.status(400).json({ error: sError?.message || 'Structure not found' });

    // Fetch students in class not already assigned
    const { data: students, error: stError } = await supabase
        .from('students')
        .select('id')
        .eq('school_id', school_id)
        .eq('current_class_id', structure.class_id)
        .eq('is_active', true);

    if (stError) return res.status(400).json({ error: stError.message });

    let assignedCount = 0;
    for (const student of students) {
        const { data: existing } = await supabase
            .from('student_fees')
            .select('id')
            .eq('student_id', student.id)
            .eq('fee_structure_id', structure.id)
            .single();

        if (!existing) {
            await supabase
                .from('student_fees')
                .insert({
                    school_id,
                    student_id: student.id,
                    fee_structure_id: structure.id,
                    amount_due: structure.amount,
                    amount_paid: 0,
                    status: 'pending'
                });
            assignedCount++;
        }
    }

    res.json({ success: true, assignedCount });
});

// Get Filtered Fee Records
app.get('/fee-records', async (req, res) => {
    const { school_id, class_id, status, start_date, end_date } = req.query;

    let query = supabase
        .from('student_fees')
        .select(`
            *,
            students!inner (
                first_name,
                last_name,
                admission_no,
                gender,
                classes!inner (id, name),
                sections (name)
            ),
            fee_structure:fee_structures!inner (
                amount,
                due_date,
                fee_head:fee_heads (name)
            )
        `)
        .eq('school_id', school_id);

    if (class_id && class_id !== 'all') {
        query = query.eq('students.classes.id', class_id);
    }
    if (status && status !== 'all') {
        query = query.eq('status', status);
    }
    if (start_date) {
        query = query.gte('fee_structure.due_date', start_date);
    }
    if (end_date) {
        query = query.lte('fee_structure.due_date', end_date);
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
});

// Get Filtered Transactions
app.get('/transactions/history', async (req, res) => {
    const { school_id, class_id, payment_mode, start_date, end_date } = req.query;

    let query = supabase
        .from('fee_transactions')
        .select(`
            *,
            students!inner (
                first_name,
                last_name,
                admission_no,
                classes!inner (id, name)
            )
        `)
        .eq('school_id', school_id);

    if (class_id && class_id !== 'all') {
        query = query.eq('students.classes.id', class_id);
    }
    if (payment_mode && payment_mode !== 'all') {
        query = query.eq('payment_mode', payment_mode);
    }
    if (start_date) {
        query = query.gte('payment_date', start_date);
    }
    if (end_date) {
        query = query.lte('payment_date', end_date);
    }

    const { data, error } = await query.order('payment_date', { ascending: false });
    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
});

// Razorpay: Create Order
app.post('/payments/create-order', async (req, res) => {
    const { amount, receipt_id } = req.body;
    try {
        const options = {
            amount: amount * 100, // Amount in paise
            currency: 'INR',
            receipt: receipt_id,
        };
        const order = await razorpay.orders.create(options);
        res.json({ orderId: order.id, amount: order.amount, currency: order.currency });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

// Razorpay: Verify Payment
app.post('/payments/verify', async (req, res) => {
    const { order_id, payment_id, signature } = req.body;
    const generatedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
        .update(order_id + '|' + payment_id)
        .digest('hex');

    if (generatedSignature === signature) {
        res.json({ success: true });
    } else {
        res.status(400).json({ error: 'Payment verification failed' });
    }
});

app.get('/health', (req, res) => {
    res.json({ status: 'Finance Service is running' });
});

app.listen(PORT, () => {
    console.log(`Finance Service running on http://localhost:${PORT}`);
});
