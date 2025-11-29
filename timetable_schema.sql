
-- Class Periods (e.g., Period 1: 09:00 - 09:45)
create table if not exists public.class_periods (
  id uuid primary key default uuid_generate_v4(),
  school_id uuid references schools(id) on delete cascade not null,
  name text not null, -- Period 1, Break, etc.
  start_time time not null,
  end_time time not null,
  order_index integer default 0,
  created_at timestamptz default now()
);

-- Timetable (The actual schedule)
create table if not exists public.timetable (
  id uuid primary key default uuid_generate_v4(),
  school_id uuid references schools(id) on delete cascade not null,
  class_id uuid references classes(id) on delete cascade not null,
  section_id uuid references sections(id) on delete cascade not null,
  day_of_week integer not null check (day_of_week between 1 and 7), -- 1=Monday, 7=Sunday
  period_id uuid references class_periods(id) on delete cascade not null,
  subject_id uuid references subjects(id) on delete cascade, -- Nullable for breaks/free periods
  teacher_id uuid references teachers(id) on delete set null, -- Nullable
  created_at timestamptz default now(),
  
  unique(section_id, day_of_week, period_id) -- No double booking for a section
);

-- RLS
alter table public.class_periods enable row level security;
alter table public.timetable enable row level security;

-- Policies for class_periods
create policy "Tenant Isolation Select Periods" on public.class_periods
  for select using (school_id = (select school_id from user_profiles where id = auth.uid()));

create policy "Tenant Isolation Insert Periods" on public.class_periods
  for insert with check (school_id = (select school_id from user_profiles where id = auth.uid()));

create policy "Tenant Isolation Update Periods" on public.class_periods
  for update using (school_id = (select school_id from user_profiles where id = auth.uid()));

create policy "Tenant Isolation Delete Periods" on public.class_periods
  for delete using (school_id = (select school_id from user_profiles where id = auth.uid()));

-- Policies for timetable
create policy "Tenant Isolation Select Timetable" on public.timetable
  for select using (school_id = (select school_id from user_profiles where id = auth.uid()));

create policy "Tenant Isolation Insert Timetable" on public.timetable
  for insert with check (school_id = (select school_id from user_profiles where id = auth.uid()));

create policy "Tenant Isolation Update Timetable" on public.timetable
  for update using (school_id = (select school_id from user_profiles where id = auth.uid()));

create policy "Tenant Isolation Delete Timetable" on public.timetable
  for delete using (school_id = (select school_id from user_profiles where id = auth.uid()));

-- Grants
grant all on public.class_periods to authenticated;
grant all on public.class_periods to service_role;
grant all on public.class_periods to postgres;

grant all on public.timetable to authenticated;
grant all on public.timetable to service_role;
grant all on public.timetable to postgres;
