create table if not exists push_subscriptions (
  endpoint text primary key,
  user_id text not null default '',
  p256dh text not null default '',
  auth text not null default '',
  created_at timestamptz not null default now()
);
create index if not exists push_subscriptions_user_idx on push_subscriptions (user_id);
alter table shop_settings add column if not exists vapid_public text not null default '';
alter table shop_settings add column if not exists vapid_private text not null default '';
