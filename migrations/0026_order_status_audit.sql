create table if not exists order_status_audit (
  id text primary key,
  order_id text not null,
  from_status text not null default '',
  to_status text not null,
  actor_id text not null default '',
  created_at timestamptz not null default now()
);
create index if not exists order_status_audit_order_idx on order_status_audit (order_id, created_at desc);
