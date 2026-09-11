-- Diagnostic Admin desk kill switch. Default OFF until an admin turns it on.
alter table shop_settings add column if not exists staff_admin_login_enabled boolean not null default false;
alter table shop_settings add column if not exists staff_admin_login_touched boolean not null default false;
