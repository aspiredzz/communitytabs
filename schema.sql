create extension if not exists "pgcrypto";

create table tabs (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  created_at timestamptz default now()
);

create table items (
  id uuid primary key default gen_random_uuid(),
  tab_id uuid references tabs(id) on delete cascade,
  type text not null,
  content text not null,
  created_at timestamptz default now()
);

alter table tabs enable row level security;
alter table items enable row level security;

create policy "anyone can read tabs" on tabs
  for select using (true);

create policy "anyone can create tabs" on tabs
  for insert with check (true);

create policy "anyone can read items" on items
  for select using (true);

create policy "anyone can create items" on items
  for insert with check (true);

insert into storage.buckets (id, name, public)
values ('uploads', 'uploads', true)
on conflict (id) do nothing;

create policy "public read uploads" on storage.objects
  for select using (bucket_id = 'uploads');

create policy "anyone can upload" on storage.objects
  for insert with check (bucket_id = 'uploads');

alter publication supabase_realtime add table tabs;
alter publication supabase_realtime add table items;
