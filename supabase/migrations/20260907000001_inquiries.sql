-- Inquiries module: Store contact form submissions from website visitors

create table if not exists public.inquiries (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null,
  phone text,
  company text,
  subject text,
  message text not null,
  status text not null default 'new',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_inquiries_created_at
  on public.inquiries(created_at desc);

create index if not exists idx_inquiries_status
  on public.inquiries(status);

alter table public.inquiries enable row level security;

-- Allow public / anon to submit inquiries
create policy "Anyone can insert inquiries"
  on public.inquiries for insert
  with check (true);

-- Authenticated users (admin/staff) can view, update status, and delete inquiries
create policy "Authenticated users can select inquiries"
  on public.inquiries for select
  to authenticated
  using (true);

create policy "Authenticated users can update inquiries"
  on public.inquiries for update
  to authenticated
  using (true)
  with check (true);

create policy "Authenticated users can delete inquiries"
  on public.inquiries for delete
  to authenticated
  using (true);

-- Timestamp trigger
create or replace function public.set_inquiries_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists update_inquiries_updated_at on public.inquiries;
create trigger update_inquiries_updated_at
  before update on public.inquiries
  for each row execute function public.set_inquiries_updated_at();
