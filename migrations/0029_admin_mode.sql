-- Per-account Admin mode. Existing shop admins stay allowed and in desk.
alter table profiles add column if not exists admin_mode boolean not null default false;
alter table profiles add column if not exists admin_mode_allowed boolean not null default false;
update profiles set admin_mode_allowed = true, admin_mode = true where role = 'admin';
