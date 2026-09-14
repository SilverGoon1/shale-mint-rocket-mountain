alter table shop_settings add column if not exists delivery_fee_on boolean not null default true;
alter table menu_items add column if not exists groups jsonb;
