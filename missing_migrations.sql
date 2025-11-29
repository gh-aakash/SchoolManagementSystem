
-- 1. Create Notifications Table (if not exists)
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID REFERENCES schools(id) NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('General', 'Fee Reminder', 'Exam Result', 'Transport')),
    status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Scheduled', 'Sent', 'Failed', 'Partial')),
    scheduled_at TIMESTAMP WITH TIME ZONE,
    sent_at TIMESTAMP WITH TIME ZONE,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    channels TEXT[] DEFAULT ARRAY['App']::TEXT[] -- New column for channels
);

-- 2. Create Notification Recipients Table (if not exists)
CREATE TABLE IF NOT EXISTS notification_recipients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    notification_id UUID REFERENCES notifications(id) ON DELETE CASCADE NOT NULL,
    recipient_type TEXT NOT NULL CHECK (recipient_type IN ('Student', 'Teacher', 'Driver', 'Parent')),
    recipient_id UUID NOT NULL,
    status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Sent', 'Failed', 'Read')),
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Enable RLS for Notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_recipients ENABLE ROW LEVEL SECURITY;

-- 4. Add RLS Policies (Drop first to avoid errors if they exist)
DROP POLICY IF EXISTS "Tenant Isolation for Notifications" ON notifications;
CREATE POLICY "Tenant Isolation for Notifications" ON notifications
    USING (school_id = (SELECT school_id FROM user_profiles WHERE user_profiles.id = auth.uid()));

DROP POLICY IF EXISTS "Tenant Isolation for Recipients" ON notification_recipients;
CREATE POLICY "Tenant Isolation for Recipients" ON notification_recipients
    USING (
        notification_id IN (
            SELECT id FROM notifications WHERE school_id = (SELECT school_id FROM user_profiles WHERE user_profiles.id = auth.uid())
        )
    );

-- 5. Add Email to Students Table
ALTER TABLE students ADD COLUMN IF NOT EXISTS email TEXT;

-- 6. Add Channels to Notifications (if table existed but column didn't)
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS channels TEXT[] DEFAULT ARRAY['App']::TEXT[];
