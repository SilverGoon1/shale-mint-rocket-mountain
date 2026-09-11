alter table profiles add column if not exists admin_mode boolean not null default false;
alter table profiles add column if not exists admin_mode_allowed boolean not null default false;
alter table profiles add column if not exists desk_grant boolean not null default false;
alter table profiles alter column role set default 'customer';
alter table profiles alter column admin_mode set default false;
alter table profiles alter column admin_mode_allowed set default false;
create table if not exists desk_grant_audit (
  id text primary key,
  actor_id text not null default '',
  target_id text not null default '',
  action text not null default '',
  created_at timestamptz not null default now()
);
