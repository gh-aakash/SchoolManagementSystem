-- Enable necessary extensions
create extension if not exists "uuid-ossp";

-- -----------------------------------------------------------------------------
-- 1. TENANT & ORGANIZATION STRUCTURE
-- -----------------------------------------------------------------------------

-- Schools (Tenants)
create table schools (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  address text,
  city text,
  state text,
  pincode text,
  phone text,
  email text,
  website text,
  logo_url text,
  affiliation_no text, -- CBSE/ICSE Affiliation Number
  board text, -- CBSE, ICSE, State Board
  created_at timestamptz default now()
);

-- Academic Years (Session Management)
create table academic_years (
  id uuid primary key default uuid_generate_v4(),
  school_id uuid references schools(id) on delete cascade not null,
  name text not null, -- e.g., "2025-2026"
  start_date date not null,
  end_date date not null,
  is_active boolean default false,
  created_at timestamptz default now()
);

-- -----------------------------------------------------------------------------
-- 2. USER MANAGEMENT (RBAC)
-- -----------------------------------------------------------------------------

-- User Roles Enum
create type user_role as enum ('super_admin', 'admin', 'accountant', 'teacher', 'parent', 'student');

-- User Profiles (Extends Supabase Auth)
create table user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  school_id uuid references schools(id) on delete cascade, -- Nullable for super_admin
  role user_role not null default 'parent',
  full_name text,
  email text,
  phone text,
  created_at timestamptz default now()
);

-- -----------------------------------------------------------------------------
-- 3. ACADEMIC STRUCTURE
-- -----------------------------------------------------------------------------

-- Classes (Standard grades like 1, 2, 3...)
create table classes (
  id uuid primary key default uuid_generate_v4(),
  school_id uuid references schools(id) on delete cascade not null,
  name text not null, -- e.g., "Class 10"
  order_index integer not null default 0, -- For sorting
  created_at timestamptz default now()
);

-- Sections (Divisions like A, B, C)
create table sections (
  id uuid primary key default uuid_generate_v4(),
  school_id uuid references schools(id) on delete cascade not null,
  class_id uuid references classes(id) on delete cascade not null,
  name text not null, -- e.g., "A"
  created_at timestamptz default now()
);

-- Subjects
create table subjects (
  id uuid primary key default uuid_generate_v4(),
  school_id uuid references schools(id) on delete cascade not null,
  name text not null, -- e.g., "Mathematics"
  code text, -- e.g., "MATH101"
  type text default 'theory', -- theory, practical
  created_at timestamptz default now()
);

-- -----------------------------------------------------------------------------
-- 4. STUDENT INFORMATION SYSTEM (SIS)
-- -----------------------------------------------------------------------------

-- Students
create table students (
  id uuid primary key default uuid_generate_v4(),
  school_id uuid references schools(id) on delete cascade not null,
  admission_no text not null,
  roll_no text,
  
  -- Personal Details
  first_name text not null,
  last_name text,
  gender text check (gender in ('Male', 'Female', 'Other')),
  dob date,
  blood_group text,
  religion text,
  caste_category text, -- General, OBC, SC, ST
  aadhar_no text,
  
  -- Parent Details
  father_name text,
  mother_name text,
  father_phone text,
  mother_phone text,
  annual_income numeric, -- For RTE compliance
  
  -- Contact
  address text,
  city text,
  state text,
  pincode text,
  
  -- Academic Link
  current_class_id uuid references classes(id),
  current_section_id uuid references sections(id),
  academic_year_id uuid references academic_years(id),
  
  -- Documents (Supabase Storage Paths)
  photo_url text,
  tc_url text,
  birth_cert_url text,
  
  is_active boolean default true,
  created_at timestamptz default now()
);

-- -----------------------------------------------------------------------------
-- 5. TRANSPORT MODULE
-- -----------------------------------------------------------------------------

create table transport_routes (
  id uuid primary key default uuid_generate_v4(),
  school_id uuid references schools(id) on delete cascade not null,
  route_name text not null, -- e.g., "Route 4 - Andheri West"
  vehicle_number text,
  driver_name text,
  driver_phone text,
  created_at timestamptz default now()
);

create table transport_stops (
  id uuid primary key default uuid_generate_v4(),
  school_id uuid references schools(id) on delete cascade not null,
  route_id uuid references transport_routes(id) on delete cascade not null,
  stop_name text not null,
  pickup_time time,
  drop_time time,
  monthly_fee numeric default 0,
  created_at timestamptz default now()
);

-- Link student to transport
alter table students add column transport_stop_id uuid references transport_stops(id);

-- -----------------------------------------------------------------------------
-- 6. FEE MANAGEMENT
-- -----------------------------------------------------------------------------

-- Fee Heads (e.g., Tuition Fee, Annual Fee)
create table fee_heads (
  id uuid primary key default uuid_generate_v4(),
  school_id uuid references schools(id) on delete cascade not null,
  name text not null,
  description text,
  created_at timestamptz default now()
);

-- Fee Structure (Assigning amounts to classes)
create table fee_structures (
  id uuid primary key default uuid_generate_v4(),
  school_id uuid references schools(id) on delete cascade not null,
  class_id uuid references classes(id) on delete cascade not null,
  fee_head_id uuid references fee_heads(id) on delete cascade not null,
  academic_year_id uuid references academic_years(id) not null,
  amount numeric not null default 0,
  due_date date,
  created_at timestamptz default now()
);

-- Student Fee Records (Generated for each student based on structure)
create table student_fees (
  id uuid primary key default uuid_generate_v4(),
  school_id uuid references schools(id) on delete cascade not null,
  student_id uuid references students(id) on delete cascade not null,
  fee_structure_id uuid references fee_structures(id) on delete cascade not null,
  amount_due numeric not null,
  amount_paid numeric default 0,
  status text default 'pending', -- pending, partial, paid
  created_at timestamptz default now()
);

-- Fee Transactions (Payments)
create table fee_transactions (
  id uuid primary key default uuid_generate_v4(),
  school_id uuid references schools(id) on delete cascade not null,
  student_id uuid references students(id) on delete cascade not null,
  amount numeric not null,
  payment_date timestamptz default now(),
  payment_mode text not null, -- cash, cheque, online (razorpay)
  reference_no text, -- Cheque No / Transaction ID
  razorpay_order_id text,
  razorpay_payment_id text,
  remarks text
);

-- -----------------------------------------------------------------------------
-- 7. EXAM & RESULTS
-- -----------------------------------------------------------------------------

create table exams (
  id uuid primary key default uuid_generate_v4(),
  school_id uuid references schools(id) on delete cascade not null,
  academic_year_id uuid references academic_years(id) not null,
  name text not null, -- e.g., "Half Yearly Exam"
  start_date date,
  end_date date,
  created_at timestamptz default now()
);

create table exam_results (
  id uuid primary key default uuid_generate_v4(),
  school_id uuid references schools(id) on delete cascade not null,
  exam_id uuid references exams(id) on delete cascade not null,
  student_id uuid references students(id) on delete cascade not null,
  subject_id uuid references subjects(id) on delete cascade not null,
  marks_obtained numeric,
  max_marks numeric,
  grade text,
  remarks text,
  created_at timestamptz default now()
);

-- -----------------------------------------------------------------------------
-- 8. ROW LEVEL SECURITY (RLS) POLICIES
-- -----------------------------------------------------------------------------

-- Helper function to get current user's school_id
create or replace function get_my_school_id()
returns uuid as $$
  select school_id from user_profiles where id = auth.uid();
$$ language sql security definer;

-- Enable RLS on all tables
alter table schools enable row level security;
alter table academic_years enable row level security;
alter table user_profiles enable row level security;
alter table classes enable row level security;
alter table sections enable row level security;
alter table subjects enable row level security;
alter table students enable row level security;
alter table transport_routes enable row level security;
alter table transport_stops enable row level security;
alter table fee_heads enable row level security;
alter table fee_structures enable row level security;
alter table student_fees enable row level security;
alter table fee_transactions enable row level security;
alter table exams enable row level security;
alter table exam_results enable row level security;

-- Policy: Schools
-- Super admins can see all, others only their own school
create policy "Users can view their own school" on schools
  for select using (id = get_my_school_id());

-- Policy: Generic for most tables (view/edit only data from own school)
-- We will apply this pattern to all school-linked tables

-- Academic Years
create policy "Tenant Isolation" on academic_years
  using (school_id = get_my_school_id());

-- User Profiles
create policy "View own profile and school users" on user_profiles
  for select using (
    auth.uid() = id -- View self
    or school_id = get_my_school_id() -- View others in same school
  );

-- Classes
create policy "Tenant Isolation" on classes using (school_id = get_my_school_id());

-- Sections
create policy "Tenant Isolation" on sections using (school_id = get_my_school_id());

-- Subjects
create policy "Tenant Isolation" on subjects using (school_id = get_my_school_id());

-- Students
create policy "Tenant Isolation" on students using (school_id = get_my_school_id());

-- Transport
create policy "Tenant Isolation" on transport_routes using (school_id = get_my_school_id());
create policy "Tenant Isolation" on transport_stops using (school_id = get_my_school_id());

-- Fees
create policy "Tenant Isolation" on fee_heads using (school_id = get_my_school_id());
create policy "Tenant Isolation" on fee_structures using (school_id = get_my_school_id());
create policy "Tenant Isolation" on student_fees using (school_id = get_my_school_id());
create policy "Tenant Isolation" on fee_transactions using (school_id = get_my_school_id());

-- Exams
create policy "Tenant Isolation" on exams using (school_id = get_my_school_id());
create policy "Tenant Isolation" on exam_results using (school_id = get_my_school_id());

-- -----------------------------------------------------------------------------
-- 9. INDEXES FOR PERFORMANCE
-- -----------------------------------------------------------------------------

create index idx_students_school_id on students(school_id);
create index idx_students_class_section on students(current_class_id, current_section_id);
create index idx_fee_transactions_student on fee_transactions(student_id);
create index idx_exam_results_student on exam_results(student_id);

-- -----------------------------------------------------------------------------
-- 10. AUTOMATIC USER & SCHOOL CREATION TRIGGER
-- -----------------------------------------------------------------------------

-- -----------------------------------------------------------------------------
-- 10. AUTOMATIC USER & SCHOOL CREATION TRIGGER
-- -----------------------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger as $$
declare
  new_school_id uuid;
  new_class_id uuid;
  i integer;
begin
  -- 1. Create a new school if school_name is provided in metadata
  if new.raw_user_meta_data->>'school_name' is not null then
    insert into public.schools (name)
    values (new.raw_user_meta_data->>'school_name')
    returning id into new_school_id;
    
    -- 2. Create the user profile linked to this school as 'admin'
    insert into public.user_profiles (id, school_id, role, full_name, email)
    values (
      new.id, 
      new_school_id, 
      'admin', 
      new.raw_user_meta_data->>'full_name', 
      new.email
    );

    -- 3. SEED INITIAL DATA
    -- Create Classes 1 to 10
    for i in 1..10 loop
      insert into public.classes (school_id, name, order_index)
      values (new_school_id, 'Class ' || i, i)
      returning id into new_class_id;

      -- Create Section A for each class
      insert into public.sections (school_id, class_id, name)
      values (new_school_id, new_class_id, 'A');
    end loop;

    -- Create Fee Heads
    (new_school_id, 'Tuition Fee', 'Monthly tuition fee'),
    (new_school_id, 'Admission Fee', 'One-time admission fee');

    -- Create Academic Year (2025-2026)
    insert into public.academic_years (school_id, name, start_date, end_date, is_active)
    values (new_school_id, '2025-2026', '2025-04-01', '2026-03-31', true);

  else
    -- Fallback for users without school_name (e.g. invited users)
    insert into public.user_profiles (id, role, full_name, email)
    values (
      new.id, 
      'parent', -- Default role
      new.raw_user_meta_data->>'full_name', 
      new.email
    );
  end if;
  
  return new;
end;
$$ language plpgsql security definer;

-- Re-create Trigger (Drop first to avoid errors if it exists)
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- -----------------------------------------------------------------------------
-- 11. PERMISSIONS (CRITICAL FOR SUPABASE)
-- -----------------------------------------------------------------------------

grant usage on schema public to anon, authenticated, service_role;
grant all on all tables in schema public to anon, authenticated, service_role;
grant all on all sequences in schema public to anon, authenticated, service_role;
grant all on all routines in schema public to anon, authenticated, service_role;
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
