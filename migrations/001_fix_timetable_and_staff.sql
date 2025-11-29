-- 1. Fix Timetable Visibility
create table if not exists public.timetable (
  id uuid primary key default uuid_generate_v4(),
  school_id uuid references schools(id) on delete cascade not null,
  class_id uuid references classes(id) on delete cascade not null,
  section_id uuid references sections(id) on delete cascade not null,
  day_of_week integer not null, -- 1-7
  period_id uuid references class_periods(id) on delete cascade not null,
  subject_id uuid references subjects(id) on delete set null,
  teacher_id uuid references teachers(id) on delete set null, -- Will rename to staff later
  created_at timestamptz default now(),
  
  unique(section_id, day_of_week, period_id)
);

-- Enable RLS
alter table public.timetable enable row level security;

-- Policies
create policy "Tenant Isolation Select" on public.timetable
  for select using (school_id = (select school_id from user_profiles where id = auth.uid()));

create policy "Tenant Isolation Insert" on public.timetable
  for insert with check (school_id = (select school_id from user_profiles where id = auth.uid()));

create policy "Tenant Isolation Update" on public.timetable
  for update using (school_id = (select school_id from user_profiles where id = auth.uid()));

create policy "Tenant Isolation Delete" on public.timetable
  for delete using (school_id = (select school_id from user_profiles where id = auth.uid()));


-- 2. Upgrade Faculty to Staff
-- Rename table if it exists as 'teachers'
do $$
begin
  if exists(select * from information_schema.tables where table_name = 'teachers') then
    alter table teachers rename to staff;
  end if;
end $$;

-- Create staff table if it didn't exist
create table if not exists public.staff (
  id uuid primary key default uuid_generate_v4(),
  school_id uuid references schools(id) on delete cascade not null,
  user_id uuid references auth.users(id), -- Optional link to auth user
  first_name text not null,
  last_name text,
  email text,
  phone text,
  qualification text,
  joining_date date,
  designation text default 'Teacher',
  photo_url text,
  is_active boolean default true,
  created_at timestamptz default now()
);

-- Add columns if table existed but columns didn't
alter table public.staff 
add column if not exists designation text default 'Teacher',
add column if not exists photo_url text,
add column if not exists joining_date date,
add column if not exists qualification text;

-- Enable RLS for staff
alter table public.staff enable row level security;

create policy "Tenant Isolation Select" on public.staff
  for select using (school_id = (select school_id from user_profiles where id = auth.uid()));

create policy "Tenant Isolation Insert" on public.staff
  for insert with check (school_id = (select school_id from user_profiles where id = auth.uid()));

create policy "Tenant Isolation Update" on public.staff
  for update using (school_id = (select school_id from user_profiles where id = auth.uid()));

create policy "Tenant Isolation Delete" on public.staff
  for delete using (school_id = (select school_id from user_profiles where id = auth.uid()));
