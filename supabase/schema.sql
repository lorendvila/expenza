-- ============================================================
-- EXPENZA - Supabase Schema + RLS Policies
-- Run this in your Supabase SQL editor
-- ============================================================

-- COMPANIES
create table if not exists companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  tax_id text,
  country text,
  created_at timestamptz default now()
);

-- USER ↔ COMPANY mapping
create table if not exists user_companies (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade,
  company_id uuid references companies on delete cascade,
  role text default 'owner',
  unique(user_id, company_id)
);

-- PROJECTS
create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies on delete cascade,
  user_id uuid references auth.users on delete cascade,
  name text not null,
  start_date date,
  end_date date,
  destination_country text,
  status text default 'active',
  notes text,
  created_at timestamptz default now()
);

-- EXPENSES
create table if not exists expenses (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects on delete set null,
  company_id uuid references companies on delete cascade,
  user_id uuid references auth.users on delete cascade,
  date date,
  supplier text,
  total_amount numeric,
  tax_amount numeric,
  net_amount numeric,
  tax_id text,
  currency text default 'EUR',
  category text,
  country text,
  notes text,
  file_url text,
  raw_ocr_text text,
  ai_raw_response jsonb,
  created_at timestamptz default now()
);

-- ============================================================
-- STORAGE BUCKET for receipts
-- ============================================================
insert into storage.buckets (id, name, public)
values ('receipts', 'receipts', true)
on conflict (id) do nothing;

-- Allow authenticated users to upload to receipts bucket
create policy "Authenticated users can upload receipts"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'receipts');

create policy "Public read access for receipts"
  on storage.objects for select
  to public
  using (bucket_id = 'receipts');

create policy "Users can delete own receipts"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'receipts' and auth.uid()::text = (storage.foldername(name))[1]);

-- ============================================================
-- ENABLE RLS
-- ============================================================
alter table companies enable row level security;
alter table user_companies enable row level security;
alter table projects enable row level security;
alter table expenses enable row level security;

-- ============================================================
-- RLS POLICIES - Companies
-- Users see companies they belong to
-- ============================================================
create policy "Users see their companies"
  on companies for select
  to authenticated
  using (
    id in (
      select company_id from user_companies
      where user_id = auth.uid()
    )
  );

create policy "Users can create companies"
  on companies for insert
  to authenticated
  with check (true);

create policy "Company owners can update"
  on companies for update
  to authenticated
  using (
    id in (
      select company_id from user_companies
      where user_id = auth.uid() and role = 'owner'
    )
  );

-- ============================================================
-- RLS POLICIES - User Companies
-- ============================================================
create policy "Users see their own user_companies"
  on user_companies for select
  to authenticated
  using (user_id = auth.uid());

create policy "Users can insert user_companies"
  on user_companies for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "Users can delete own user_companies"
  on user_companies for delete
  to authenticated
  using (user_id = auth.uid());

-- ============================================================
-- RLS POLICIES - Projects
-- Users see projects from their companies
-- ============================================================
create policy "Users see company projects"
  on projects for select
  to authenticated
  using (
    company_id in (
      select company_id from user_companies
      where user_id = auth.uid()
    )
  );

create policy "Users can create projects in their companies"
  on projects for insert
  to authenticated
  with check (
    company_id in (
      select company_id from user_companies
      where user_id = auth.uid()
    )
  );

create policy "Users can update company projects"
  on projects for update
  to authenticated
  using (
    company_id in (
      select company_id from user_companies
      where user_id = auth.uid()
    )
  );

create policy "Users can delete company projects"
  on projects for delete
  to authenticated
  using (
    company_id in (
      select company_id from user_companies
      where user_id = auth.uid()
    )
  );

-- ============================================================
-- RLS POLICIES - Expenses
-- Users see expenses from their companies
-- ============================================================
create policy "Users see company expenses"
  on expenses for select
  to authenticated
  using (
    company_id in (
      select company_id from user_companies
      where user_id = auth.uid()
    )
  );

create policy "Users can create expenses in their companies"
  on expenses for insert
  to authenticated
  with check (
    company_id in (
      select company_id from user_companies
      where user_id = auth.uid()
    )
  );

create policy "Users can update company expenses"
  on expenses for update
  to authenticated
  using (
    company_id in (
      select company_id from user_companies
      where user_id = auth.uid()
    )
  );

create policy "Users can delete company expenses"
  on expenses for delete
  to authenticated
  using (
    company_id in (
      select company_id from user_companies
      where user_id = auth.uid()
    )
  );

-- ============================================================
-- HELPER FUNCTION: auto-create company on first user signup
-- ============================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  -- No automatic company creation; handled by frontend on first login
  return new;
end;
$$;
