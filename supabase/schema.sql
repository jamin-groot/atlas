-- Navigator Memory table
create table if not exists navigator_memory (
  wallet      text primary key,
  messages    jsonb not null default '[]',
  context     jsonb not null default '{}',
  updated_at  timestamptz not null default now()
);

alter table navigator_memory enable row level security;

-- Allow anyone to read/write their own memory (wallet is the key)
create policy "Anyone can upsert memory" on navigator_memory
  for all using (true) with check (true);
