
-- Run this in your Supabase SQL Editor

create table if not exists public.automations (
  id uuid not null default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  name text not null,
  description text,
  trigger_type text not null, -- 'FEE_DUE', 'NEW_ADMISSION', 'ATTENDANCE_LOW'
  conditions jsonb not null default '[]'::jsonb, -- Recursive AND/OR structure
  actions jsonb not null default '[]'::jsonb, -- Array of actions
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  constraint automations_pkey primary key (id)
);

-- RLS for Automations
alter table public.automations enable row level security;

drop policy if exists "Users can view their school's automations" on public.automations;
create policy "Users can view their school's automations"
on public.automations for select
to authenticated
using (school_id in (select school_id from public.user_profiles where id = auth.uid()));

drop policy if exists "Users can insert their school's automations" on public.automations;
create policy "Users can insert their school's automations"
on public.automations for insert
to authenticated
with check (school_id in (select school_id from public.user_profiles where id = auth.uid()));

drop policy if exists "Users can update their school's automations" on public.automations;
create policy "Users can update their school's automations"
on public.automations for update
to authenticated
using (school_id in (select school_id from public.user_profiles where id = auth.uid()));

drop policy if exists "Users can delete their school's automations" on public.automations;
create policy "Users can delete their school's automations"
on public.automations for delete
to authenticated
using (school_id in (select school_id from public.user_profiles where id = auth.uid()));

-- Grant permissions
grant all on public.automations to authenticated;
grant all on public.automations to service_role;
