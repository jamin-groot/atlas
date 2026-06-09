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

-- APY snapshots — track historical APY per opportunity for change detection
create table if not exists apy_snapshots (
  opportunity_id  text primary key,
  apy             numeric not null,
  protocol        text,
  symbol          text,
  updated_at      timestamptz not null default now()
);

alter table apy_snapshots enable row level security;
create policy "Anyone can read/write apy_snapshots" on apy_snapshots
  for all using (true) with check (true);

-- Agent alerts — proactive messages generated autonomously by the Navigator
create table if not exists agent_alerts (
  id              uuid primary key default gen_random_uuid(),
  wallet          text not null,
  opportunity_id  text,
  message         text not null,
  apy_from        numeric,
  apy_to          numeric,
  action          text,   -- 'rebalance' | 'allocate' | 'monitor'
  read            boolean not null default false,
  created_at      timestamptz not null default now()
);

alter table agent_alerts enable row level security;
create policy "Anyone can read/write agent_alerts" on agent_alerts
  for all using (true) with check (true);
