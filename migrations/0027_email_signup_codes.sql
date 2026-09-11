create table if not exists email_signup_codes (
  id text primary key,
  user_id text not null,
  email text not null,
  code_hash text not null,
  salt text not null,
  expires_at timestamptz not null,
  attempts integer not null default 0,
  consumed_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists email_signup_codes_user_idx on email_signup_codes (user_id, created_at desc);
create index if not exists email_signup_codes_email_idx on email_signup_codes (email, created_at desc);
