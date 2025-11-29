-- Notification Templates
CREATE TABLE notification_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID REFERENCES schools(id) NOT NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('General', 'Fee Reminder', 'Exam Result', 'Transport')),
    template_body TEXT NOT NULL, -- e.g. "Dear {{parent_name}}, fee of {{amount}} is due for {{student_name}}."
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notifications (The actual message sent)
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID REFERENCES schools(id) NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('General', 'Fee Reminder', 'Exam Result', 'Transport')),
    status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Scheduled', 'Sent', 'Failed')),
    scheduled_at TIMESTAMP WITH TIME ZONE,
    sent_at TIMESTAMP WITH TIME ZONE,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notification Recipients (Who gets the message)
CREATE TABLE notification_recipients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    notification_id UUID REFERENCES notifications(id) ON DELETE CASCADE NOT NULL,
    recipient_type TEXT NOT NULL CHECK (recipient_type IN ('Student', 'Teacher', 'Driver', 'Parent')),
    recipient_id UUID NOT NULL, -- Can be student_id, teacher_id, etc.
    status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Sent', 'Failed', 'Read')),
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE notification_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_recipients ENABLE ROW LEVEL SECURITY;

-- Templates Policies
CREATE POLICY "Tenant Isolation for Templates" ON notification_templates
    USING (school_id = (SELECT school_id FROM user_profiles WHERE user_profiles.id = auth.uid()));

-- Notifications Policies
CREATE POLICY "Tenant Isolation for Notifications" ON notifications
    USING (school_id = (SELECT school_id FROM user_profiles WHERE user_profiles.id = auth.uid()));

-- Recipients Policies
CREATE POLICY "Tenant Isolation for Recipients" ON notification_recipients
    USING (
        notification_id IN (
            SELECT id FROM notifications WHERE school_id = (SELECT school_id FROM user_profiles WHERE user_profiles.id = auth.uid())
        )
    );
