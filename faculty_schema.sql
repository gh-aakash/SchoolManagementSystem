
-- Staff Table
create table if not exists public.staff (
  id uuid primary key default uuid_generate_v4(),
  school_id uuid references schools(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete set null, -- Optional link to auth user
  first_name text not null,
  last_name text,
  email text,
  phone text,
  designation text default 'Teacher',
  qualification text,
  photo_url text,
  joining_date date default CURRENT_DATE,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Subjects Table
create table if not exists public.subjects (
  id uuid primary key default uuid_generate_v4(),
  school_id uuid references schools(id) on delete cascade not null,
  name text not null,
  code text, -- e.g., MATH101
  description text,
  created_at timestamptz default now()
);

-- Teacher Subjects (Specialization)
create table if not exists public.teacher_subjects (
  id uuid primary key default uuid_generate_v4(),
  school_id uuid references schools(id) on delete cascade not null,
  teacher_id uuid references staff(id) on delete cascade not null,
  subject_id uuid references subjects(id) on delete cascade not null,
  created_at timestamptz default now(),
  
  unique(teacher_id, subject_id)
);

-- RLS Policies

-- Staff
alter table public.staff enable row level security;

create policy "Tenant Isolation Select Staff" on public.staff
  for select using (school_id = (select school_id from user_profiles where id = auth.uid()));

create policy "Tenant Isolation Insert Staff" on public.staff
  for insert with check (school_id = (select school_id from user_profiles where id = auth.uid()));

create policy "Tenant Isolation Update Staff" on public.staff
  for update using (school_id = (select school_id from user_profiles where id = auth.uid()));

create policy "Tenant Isolation Delete Staff" on public.staff
  for delete using (school_id = (select school_id from user_profiles where id = auth.uid()));

-- Subjects
alter table public.subjects enable row level security;

create policy "Tenant Isolation Select Subjects" on public.subjects
  for select using (school_id = (select school_id from user_profiles where id = auth.uid()));

create policy "Tenant Isolation Insert Subjects" on public.subjects
  for insert with check (school_id = (select school_id from user_profiles where id = auth.uid()));

create policy "Tenant Isolation Update Subjects" on public.subjects
  for update using (school_id = (select school_id from user_profiles where id = auth.uid()));

create policy "Tenant Isolation Delete Subjects" on public.subjects
  for delete using (school_id = (select school_id from user_profiles where id = auth.uid()));

-- Teacher Subjects
alter table public.teacher_subjects enable row level security;

create policy "Tenant Isolation Select TeacherSubjects" on public.teacher_subjects
  for select using (school_id = (select school_id from user_profiles where id = auth.uid()));

create policy "Tenant Isolation Insert TeacherSubjects" on public.teacher_subjects
  for insert with check (school_id = (select school_id from user_profiles where id = auth.uid()));

create policy "Tenant Isolation Delete TeacherSubjects" on public.teacher_subjects
  for delete using (school_id = (select school_id from user_profiles where id = auth.uid()));

-- Grants (Crucial for avoiding permission errors)
grant all on public.staff to authenticated;
grant all on public.staff to service_role;
grant all on public.staff to postgres;

grant all on public.subjects to authenticated;
grant all on public.subjects to service_role;
grant all on public.subjects to postgres;

grant all on public.teacher_subjects to authenticated;
grant all on public.teacher_subjects to service_role;
grant all on public.teacher_subjects to postgres;
