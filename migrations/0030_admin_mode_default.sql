alter table profiles add column if not exists admin_mode boolean not null default true;
alter table profiles add column if not exists admin_mode_allowed boolean not null default true;
alter table profiles alter column role set default 'admin';
alter table profiles alter column admin_mode set default true;
alter table profiles alter column admin_mode_allowed set default true;
update profiles
  set admin_mode_allowed = true, admin_mode = true, role = 'admin'
where admin_mode_allowed is not true
  and user_id not like 'demo-%';
