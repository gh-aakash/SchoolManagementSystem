
-- Attendance Table
create table if not exists public.attendance (
  id uuid primary key default uuid_generate_v4(),
  school_id uuid references schools(id) on delete cascade not null,
  student_id uuid references students(id) on delete cascade not null,
  date date not null,
  status text not null check (status in ('Present', 'Absent', 'Late', 'Half-day')),
  remarks text,
  created_at timestamptz default now(),
  
  unique(student_id, date) -- One record per student per day
);

-- RLS
alter table public.attendance enable row level security;

create policy "Tenant Isolation" on public.attendance
  using (school_id = (select school_id from user_profiles where id = auth.uid()));

create policy "Tenant Isolation Insert" on public.attendance
  for insert with check (school_id = (select school_id from user_profiles where id = auth.uid()));

create policy "Tenant Isolation Update" on public.attendance
  for update using (school_id = (select school_id from user_profiles where id = auth.uid()));

create policy "Tenant Isolation Delete" on public.attendance
  for delete using (school_id = (select school_id from user_profiles where id = auth.uid()));

-- Grants
grant all on public.attendance to authenticated;
grant all on public.attendance to service_role;
grant all on public.attendance to postgres;
