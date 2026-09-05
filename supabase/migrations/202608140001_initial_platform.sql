-- E-MEDIA production schema. Timestamps are UTC; presentation defaults to Europe/London.
create extension if not exists pgcrypto;
create extension if not exists citext;
create extension if not exists btree_gist;

create type public.user_role as enum ('SUPER_ADMIN','ADMIN','EDITOR','CREATOR','MODERATOR','STAFF','CLIENT','MEMBER');
create type public.content_status as enum ('DRAFT','SCHEDULED','PUBLISHED','ARCHIVED');
create type public.booking_status as enum ('DRAFT','PENDING','AWAITING_PAYMENT','REQUESTED','CONFIRMED','IN_PROGRESS','COMPLETED','CANCELLED','REFUNDED','DECLINED');
create type public.booking_mode as enum ('INSTANT_BOOKING','REQUEST_TO_BOOK','QUOTE_REQUIRED','DISCOVERY_CALL','DISABLED');
create type public.pricing_mode as enum ('FIXED','FROM','QUOTE','HIDDEN');
create type public.deposit_type as enum ('NONE','FIXED','PERCENTAGE');
create type public.payment_status as enum ('PENDING','PROCESSING','SUCCEEDED','FAILED','REFUNDED','PARTIALLY_REFUNDED','CANCELLED');
create type public.project_status as enum ('PLANNING','SCHEDULED','IN_PRODUCTION','POST_PRODUCTION','REVIEW','DELIVERED','COMPLETED','ON_HOLD','CANCELLED');
create type public.lead_status as enum ('NEW','CONTACTED','QUALIFIED','QUOTE_SENT','WON','LOST','ARCHIVED');
create type public.conversation_status as enum ('OPEN','RESOLVED','ARCHIVED');
create type public.moderation_status as enum ('PENDING','REVIEWING','RESOLVED','DISMISSED');

create function public.set_updated_at() returns trigger language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end $$;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text check (char_length(display_name) <= 80),
  username citext unique check (username ~ '^[a-zA-Z0-9_]{3,30}$'),
  avatar_path text,
  bio text check (char_length(bio) <= 320),
  general_area text check (char_length(general_area) <= 80),
  interests text[] not null default '{}',
  profile_visibility text not null default 'PRIVATE' check (profile_visibility in ('PRIVATE','MEMBERS','PUBLIC')),
  community_eligible boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger profiles_updated before update on public.profiles for each row execute function public.set_updated_at();

create table public.profile_private_data (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  date_of_birth date,
  phone text,
  export_requested_at timestamptz,
  deletion_requested_at timestamptz,
  updated_at timestamptz not null default now()
);

create table public.user_roles (
  user_id uuid not null references public.profiles(id) on delete cascade,
  role public.user_role not null,
  assigned_by uuid references public.profiles(id),
  assigned_at timestamptz not null default now(),
  primary key (user_id, role)
);

create function public.has_role(required_role public.user_role) returns boolean
language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.user_roles where user_id = auth.uid() and role = required_role)
$$;

create function public.is_staff() returns boolean
language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.user_roles where user_id = auth.uid() and role in ('SUPER_ADMIN','ADMIN','EDITOR','CREATOR','MODERATOR','STAFF'))
$$;

create function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.user_roles where user_id = auth.uid() and role in ('SUPER_ADMIN','ADMIN'))
$$;

revoke all on function public.has_role(public.user_role) from public;
revoke all on function public.is_staff() from public;
revoke all on function public.is_admin() from public;
grant execute on function public.has_role(public.user_role), public.is_staff(), public.is_admin() to authenticated;

create table public.site_settings (
  id boolean primary key default true check (id),
  business_name text not null default 'E-MEDIA',
  contact_email citext,
  phone text,
  location text not null default 'London / UK',
  logo_path text,
  socials jsonb not null default '{}',
  default_seo jsonb not null default '{}',
  footer_copy text,
  booking_policy text,
  cancellation_text text,
  tax_enabled boolean not null default false,
  tax_rate_basis_points integer check (tax_rate_basis_points between 0 and 10000),
  community_minimum_age smallint check (community_minimum_age between 13 and 120),
  community_policy_approved boolean not null default false,
  legal_reviewed_at timestamptz,
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles(id)
);

create table public.feature_flags (
  key text primary key check (key ~ '^[A-Z_]+$'),
  enabled boolean not null default false,
  disabled_experience text not null default 'COMING_SOON' check (disabled_experience in ('COMING_SOON','NOT_FOUND')),
  description text,
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles(id)
);

create table public.services (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug citext not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  service_group text not null check (service_group in ('CREATIVE_PRODUCTION','DIGITAL_TECHNOLOGY','BRAND_CONTENT')),
  summary text not null,
  description text not null,
  hero_media jsonb,
  gallery jsonb not null default '[]',
  benefits text[] not null default '{}',
  process text[] not null default '{}',
  faqs jsonb not null default '[]',
  active boolean not null default true,
  featured boolean not null default false,
  booking_mode public.booking_mode not null default 'QUOTE_REQUIRED',
  pricing_mode public.pricing_mode not null default 'QUOTE',
  sort_order integer not null default 0,
  seo_title text,
  seo_description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index services_public_order on public.services(active, service_group, sort_order);

create table public.service_packages (
  id uuid primary key default gen_random_uuid(),
  service_id uuid not null references public.services(id) on delete cascade,
  name text not null,
  summary text,
  price_minor integer check (price_minor >= 0),
  from_price_minor integer check (from_price_minor >= 0),
  currency char(3) not null default 'GBP',
  duration_minutes integer check (duration_minutes > 0),
  booking_duration_minutes integer check (booking_duration_minutes > 0),
  visible_price boolean not null default false,
  deposit_type public.deposit_type not null default 'NONE',
  deposit_value integer check (deposit_value >= 0),
  included_items text[] not null default '{}',
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((deposit_type = 'PERCENTAGE' and deposit_value between 0 and 100) or deposit_type <> 'PERCENTAGE')
);
create index packages_service_order on public.service_packages(service_id, active, sort_order);

create table public.service_addons (
  id uuid primary key default gen_random_uuid(),
  service_id uuid not null references public.services(id) on delete cascade,
  name text not null,
  description text,
  price_minor integer check (price_minor >= 0),
  currency char(3) not null default 'GBP',
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table public.availability_rules (
  id uuid primary key default gen_random_uuid(),
  service_id uuid references public.services(id) on delete cascade,
  staff_id uuid references public.profiles(id) on delete cascade,
  weekday smallint not null check (weekday between 0 and 6),
  start_time time not null,
  end_time time not null,
  timezone text not null default 'Europe/London',
  buffer_before_minutes integer not null default 0 check (buffer_before_minutes >= 0),
  buffer_after_minutes integer not null default 0 check (buffer_after_minutes >= 0),
  minimum_notice_minutes integer not null default 1440 check (minimum_notice_minutes >= 0),
  maximum_horizon_days integer not null default 90 check (maximum_horizon_days between 1 and 730),
  active boolean not null default true,
  check (start_time < end_time),
  check (service_id is not null or staff_id is not null)
);

create table public.availability_exceptions (
  id uuid primary key default gen_random_uuid(),
  service_id uuid references public.services(id) on delete cascade,
  staff_id uuid references public.profiles(id) on delete cascade,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  available boolean not null default false,
  reason text,
  created_at timestamptz not null default now(),
  check (starts_at < ends_at)
);

create table public.blocked_periods (
  id uuid primary key default gen_random_uuid(),
  service_id uuid references public.services(id) on delete cascade,
  staff_id uuid references public.profiles(id) on delete cascade,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  reason text,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  check (starts_at < ends_at)
);
create index blocked_periods_range on public.blocked_periods using gist (tstzrange(starts_at, ends_at, '[)'));

create table public.leads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  service_id uuid references public.services(id) on delete set null,
  name text not null,
  email citext not null,
  phone text,
  desired_at timestamptz,
  budget_range text,
  project_description text not null,
  attachment_paths text[] not null default '{}',
  source text,
  consent_at timestamptz not null,
  status public.lead_status not null default 'NEW',
  internal_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index leads_status_created on public.leads(status, created_at desc);

create table public.quotes (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references public.leads(id) on delete set null,
  client_id uuid references public.profiles(id) on delete set null,
  status text not null default 'DRAFT' check (status in ('DRAFT','SENT','ACCEPTED','REJECTED','EXPIRED','CANCELLED')),
  currency char(3) not null default 'GBP',
  subtotal_minor integer not null default 0 check (subtotal_minor >= 0),
  discount_minor integer not null default 0 check (discount_minor >= 0),
  tax_minor integer not null default 0 check (tax_minor >= 0),
  deposit_minor integer not null default 0 check (deposit_minor >= 0),
  total_minor integer not null default 0 check (total_minor >= 0),
  notes text,
  expires_at timestamptz,
  accepted_at timestamptz,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.quote_items (
  id uuid primary key default gen_random_uuid(),
  quote_id uuid not null references public.quotes(id) on delete cascade,
  description text not null,
  quantity numeric(12,2) not null default 1 check (quantity > 0),
  unit_price_minor integer not null check (unit_price_minor >= 0),
  sort_order integer not null default 0
);

create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references public.profiles(id) on delete set null,
  guest_email citext,
  guest_name text,
  service_id uuid not null references public.services(id),
  package_id uuid references public.service_packages(id),
  staff_id uuid references public.profiles(id),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  timezone text not null default 'Europe/London',
  location_text text,
  customer_brief text,
  internal_notes text,
  status public.booking_status not null default 'DRAFT',
  payment_status public.payment_status not null default 'PENDING',
  pricing_snapshot jsonb not null,
  currency char(3) not null default 'GBP',
  subtotal_minor integer not null check (subtotal_minor >= 0),
  discount_minor integer not null default 0 check (discount_minor >= 0),
  tax_minor integer not null default 0 check (tax_minor >= 0),
  total_minor integer not null check (total_minor >= 0),
  deposit_minor integer not null default 0 check (deposit_minor >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  slot tstzrange generated always as (tstzrange(starts_at, ends_at, '[)')) stored,
  resource_id uuid generated always as (coalesce(staff_id, service_id)) stored,
  check (starts_at < ends_at),
  check (client_id is not null or (guest_email is not null and guest_name is not null)),
  check (deposit_minor <= total_minor)
);
alter table public.bookings add constraint bookings_no_active_collision exclude using gist
  (resource_id with =, slot with &&)
  where (status in ('PENDING','AWAITING_PAYMENT','REQUESTED','CONFIRMED','IN_PROGRESS'));
create index bookings_client_created on public.bookings(client_id, created_at desc);
create index bookings_status_start on public.bookings(status, starts_at);

create table public.booking_addons (
  booking_id uuid not null references public.bookings(id) on delete cascade,
  addon_id uuid not null references public.service_addons(id),
  name_snapshot text not null,
  price_minor_snapshot integer not null check (price_minor_snapshot >= 0),
  primary key (booking_id, addon_id)
);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid references public.bookings(id) on delete set null,
  customer_id uuid references public.profiles(id) on delete set null,
  stripe_customer_id text,
  stripe_payment_intent_id text unique,
  amount_minor integer not null check (amount_minor > 0),
  refunded_minor integer not null default 0 check (refunded_minor >= 0),
  currency char(3) not null default 'GBP',
  status public.payment_status not null default 'PENDING',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (refunded_minor <= amount_minor)
);
create index payments_customer_created on public.payments(customer_id, created_at desc);

create table public.stripe_events (
  id text primary key,
  event_type text not null,
  livemode boolean not null,
  payload_hash text not null,
  processed_at timestamptz,
  processing_error text,
  created_at timestamptz not null default now()
);

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid references public.bookings(id) on delete set null,
  quote_id uuid references public.quotes(id) on delete set null,
  title text not null,
  status public.project_status not null default 'PLANNING',
  starts_at timestamptz,
  due_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.project_members (project_id uuid not null references public.projects(id) on delete cascade, user_id uuid not null references public.profiles(id) on delete cascade, member_role text not null default 'CLIENT', primary key(project_id,user_id));
create table public.project_updates (id uuid primary key default gen_random_uuid(), project_id uuid not null references public.projects(id) on delete cascade, author_id uuid references public.profiles(id), body text not null, visible_to_client boolean not null default true, created_at timestamptz not null default now());
create table public.deliverables (id uuid primary key default gen_random_uuid(), project_id uuid not null references public.projects(id) on delete cascade, title text not null, storage_path text, external_url text, expires_at timestamptz, created_at timestamptz not null default now(), check ((storage_path is not null)::integer + (external_url is not null)::integer = 1));

create table public.portfolio_projects (
  id uuid primary key default gen_random_uuid(), title text not null, slug citext not null unique, summary text not null, client_name text,
  category text not null, service_ids uuid[] not null default '{}', project_year smallint, hero_media jsonb, challenge text, approach text, outcome text,
  credits jsonb not null default '[]', featured boolean not null default false, status public.content_status not null default 'DRAFT', published_at timestamptz,
  seo_title text, seo_description text, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.portfolio_media (id uuid primary key default gen_random_uuid(), project_id uuid not null references public.portfolio_projects(id) on delete cascade, storage_path text not null, media_type text not null check (media_type in ('IMAGE','VIDEO')), alt_text text, caption text, sort_order integer not null default 0);

create table public.article_categories (id uuid primary key default gen_random_uuid(), name text not null unique, slug citext not null unique, description text, sort_order integer not null default 0);
create table public.articles (
  id uuid primary key default gen_random_uuid(), author_id uuid references public.profiles(id) on delete set null, category_id uuid references public.article_categories(id) on delete set null,
  title text not null, slug citext not null unique, excerpt text not null, body jsonb not null default '{}', cover_media jsonb, status public.content_status not null default 'DRAFT', featured boolean not null default false,
  published_at timestamptz, scheduled_at timestamptz, seo_title text, seo_description text, search_vector tsvector generated always as (to_tsvector('english', coalesce(title,'') || ' ' || coalesce(excerpt,''))) stored,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index articles_search on public.articles using gin(search_vector);
create index articles_publication on public.articles(status, published_at desc);
create table public.tags (id uuid primary key default gen_random_uuid(), name text not null unique, slug citext not null unique);
create table public.article_tags (article_id uuid not null references public.articles(id) on delete cascade, tag_id uuid not null references public.tags(id) on delete cascade, primary key(article_id,tag_id));

create table public.shows (id uuid primary key default gen_random_uuid(), title text not null, slug citext not null unique, description text not null, cover_media jsonb, status public.content_status not null default 'DRAFT', published_at timestamptz, created_at timestamptz not null default now());
create table public.videos (id uuid primary key default gen_random_uuid(), show_id uuid references public.shows(id) on delete set null, title text not null, slug citext not null unique, description text, provider text not null check (provider in ('YOUTUBE','VIMEO','MUX')), provider_asset_id text not null, poster_media jsonb, duration_seconds integer check (duration_seconds >= 0), transcript text, captions_path text, status public.content_status not null default 'DRAFT', published_at timestamptz, created_at timestamptz not null default now());
create table public.live_streams (id uuid primary key default gen_random_uuid(), title text not null, description text, provider text not null default 'MUX', provider_stream_id text, scheduled_start timestamptz, scheduled_end timestamptz, status text not null default 'OFFLINE' check (status in ('SCHEDULED','LIVE','ENDED','OFFLINE','CANCELLED')), playback_id text, archive_video_id uuid references public.videos(id), created_at timestamptz not null default now());

create table public.forum_categories (id uuid primary key default gen_random_uuid(), name text not null unique, slug citext not null unique, description text, active boolean not null default true, sort_order integer not null default 0);
create table public.forum_posts (id uuid primary key default gen_random_uuid(), author_id uuid not null references public.profiles(id) on delete cascade, category_id uuid not null references public.forum_categories(id), title text not null, slug citext not null unique, body text not null, status text not null default 'PUBLISHED' check (status in ('DRAFT','PUBLISHED','HIDDEN','LOCKED','REMOVED')), pinned boolean not null default false, locked boolean not null default false, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create index forum_posts_feed on public.forum_posts(category_id, pinned desc, created_at desc);
create table public.comments (id uuid primary key default gen_random_uuid(), post_id uuid references public.forum_posts(id) on delete cascade, article_id uuid references public.articles(id) on delete cascade, parent_id uuid references public.comments(id) on delete cascade, author_id uuid not null references public.profiles(id) on delete cascade, body text not null check (char_length(body) between 1 and 5000), status text not null default 'PUBLISHED' check (status in ('PUBLISHED','HIDDEN','REMOVED')), created_at timestamptz not null default now(), updated_at timestamptz not null default now(), check ((post_id is not null)::integer + (article_id is not null)::integer = 1));
create table public.reactions (id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id) on delete cascade, entity_type text not null check (entity_type in ('ARTICLE','VIDEO','POST','COMMENT')), entity_id uuid not null, kind text not null default 'LIKE' check (kind in ('LIKE','INSIGHTFUL','SUPPORT')), created_at timestamptz not null default now(), unique(user_id, entity_type, entity_id, kind));
create table public.bookmarks (user_id uuid not null references public.profiles(id) on delete cascade, entity_type text not null check (entity_type in ('ARTICLE','VIDEO','POST','OPPORTUNITY','EVENT')), entity_id uuid not null, created_at timestamptz not null default now(), primary key(user_id,entity_type,entity_id));

create table public.opportunities (id uuid primary key default gen_random_uuid(), title text not null, organisation text not null, description text not null, opportunity_type text not null, location text, remote boolean not null default false, deadline timestamptz, application_url text not null, tags text[] not null default '{}', featured boolean not null default false, editorial_status text not null default 'UNVERIFIED' check (editorial_status in ('UNVERIFIED','EDITOR_CHECKED','VERIFIED')), status public.content_status not null default 'DRAFT', published_at timestamptz, created_at timestamptz not null default now());
create index opportunities_active on public.opportunities(status, deadline);
create table public.events (id uuid primary key default gen_random_uuid(), title text not null, slug citext not null unique, description text not null, starts_at timestamptz not null, ends_at timestamptz, venue text, general_location text, ticket_url text, cover_media jsonb, category text, featured boolean not null default false, organiser text, price_text text, status public.content_status not null default 'DRAFT', published_at timestamptz, created_at timestamptz not null default now(), check (ends_at is null or ends_at > starts_at));

create table public.conversations (id uuid primary key default gen_random_uuid(), subject text, status public.conversation_status not null default 'OPEN', assigned_staff_id uuid references public.profiles(id) on delete set null, guest_session_hash text unique, booking_id uuid references public.bookings(id) on delete set null, project_id uuid references public.projects(id) on delete set null, last_message_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table public.conversation_participants (conversation_id uuid not null references public.conversations(id) on delete cascade, user_id uuid not null references public.profiles(id) on delete cascade, last_read_at timestamptz, joined_at timestamptz not null default now(), primary key(conversation_id,user_id));
create table public.messages (id uuid primary key default gen_random_uuid(), conversation_id uuid not null references public.conversations(id) on delete cascade, sender_id uuid references public.profiles(id) on delete set null, guest_sender_token_hash text, body text not null check (char_length(body) between 1 and 10000), attachment_path text, created_at timestamptz not null default now(), check (sender_id is not null or guest_sender_token_hash is not null));
create index messages_conversation_time on public.messages(conversation_id, created_at);

create table public.reports (id uuid primary key default gen_random_uuid(), reporter_id uuid references public.profiles(id) on delete set null, entity_type text not null, entity_id uuid not null, reason text not null, detail text, status public.moderation_status not null default 'PENDING', assigned_to uuid references public.profiles(id), created_at timestamptz not null default now(), resolved_at timestamptz);
create table public.moderation_actions (id uuid primary key default gen_random_uuid(), report_id uuid references public.reports(id) on delete set null, moderator_id uuid not null references public.profiles(id), action text not null, entity_type text, entity_id uuid, internal_note text, created_at timestamptz not null default now());
create table public.notifications (id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id) on delete cascade, type text not null, title text not null, body text, href text, read_at timestamptz, created_at timestamptz not null default now());
create index notifications_unread on public.notifications(user_id, created_at desc) where read_at is null;
create table public.newsletter_subscribers (id uuid primary key default gen_random_uuid(), email citext not null unique, status text not null default 'SUBSCRIBED' check (status in ('SUBSCRIBED','UNSUBSCRIBED','BOUNCED')), source text, consent_at timestamptz not null, unsubscribe_token uuid not null default gen_random_uuid(), unsubscribed_at timestamptz, created_at timestamptz not null default now());
create table public.testimonials (id uuid primary key default gen_random_uuid(), attribution text not null, organisation text, quote text not null, approved boolean not null default false, sort_order integer not null default 0, created_at timestamptz not null default now());
create table public.audit_logs (id bigint generated always as identity primary key, actor_id uuid references public.profiles(id) on delete set null, action text not null, entity_type text not null, entity_id text, context jsonb not null default '{}', ip_hash text, created_at timestamptz not null default now());
create index audit_logs_entity on public.audit_logs(entity_type, entity_id, created_at desc);

-- Automatic profile creation never grants staff access.
create function public.handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles(id, display_name) values (new.id, nullif(new.raw_user_meta_data ->> 'display_name',''));
  insert into public.user_roles(user_id, role) values (new.id, 'MEMBER');
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

-- First administrator must be assigned with the service role, never through a public client.
create function public.assign_initial_super_admin(target_email citext) returns void
language plpgsql security definer set search_path = public, auth as $$
declare target_id uuid;
begin
  if auth.role() <> 'service_role' then raise exception 'service role required'; end if;
  if exists(select 1 from public.user_roles where role = 'SUPER_ADMIN') then raise exception 'super admin already exists'; end if;
  select id into target_id from auth.users where lower(email) = lower(target_email::text) limit 1;
  if target_id is null then raise exception 'user not found'; end if;
  insert into public.user_roles(user_id, role) values(target_id, 'SUPER_ADMIN') on conflict do nothing;
end $$;
revoke all on function public.assign_initial_super_admin(citext) from public, anon, authenticated;
grant execute on function public.assign_initial_super_admin(citext) to service_role;

-- Row-level security
alter table public.profiles enable row level security;
alter table public.profile_private_data enable row level security;
alter table public.user_roles enable row level security;
alter table public.site_settings enable row level security;
alter table public.feature_flags enable row level security;
alter table public.services enable row level security;
alter table public.service_packages enable row level security;
alter table public.service_addons enable row level security;
alter table public.availability_rules enable row level security;
alter table public.availability_exceptions enable row level security;
alter table public.blocked_periods enable row level security;
alter table public.leads enable row level security;
alter table public.quotes enable row level security;
alter table public.quote_items enable row level security;
alter table public.bookings enable row level security;
alter table public.booking_addons enable row level security;
alter table public.payments enable row level security;
alter table public.stripe_events enable row level security;
alter table public.projects enable row level security;
alter table public.project_members enable row level security;
alter table public.project_updates enable row level security;
alter table public.deliverables enable row level security;
alter table public.portfolio_projects enable row level security;
alter table public.portfolio_media enable row level security;
alter table public.article_categories enable row level security;
alter table public.articles enable row level security;
alter table public.tags enable row level security;
alter table public.article_tags enable row level security;
alter table public.shows enable row level security;
alter table public.videos enable row level security;
alter table public.live_streams enable row level security;
alter table public.forum_categories enable row level security;
alter table public.forum_posts enable row level security;
alter table public.comments enable row level security;
alter table public.reactions enable row level security;
alter table public.bookmarks enable row level security;
alter table public.opportunities enable row level security;
alter table public.events enable row level security;
alter table public.conversations enable row level security;
alter table public.conversation_participants enable row level security;
alter table public.messages enable row level security;
alter table public.reports enable row level security;
alter table public.moderation_actions enable row level security;
alter table public.notifications enable row level security;
alter table public.newsletter_subscribers enable row level security;
alter table public.testimonials enable row level security;
alter table public.audit_logs enable row level security;

create policy profiles_public_safe_read on public.profiles for select using (profile_visibility = 'PUBLIC' or id = auth.uid() or public.is_staff());
create policy profiles_own_update on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());
create policy profile_private_own_read on public.profile_private_data for select using (user_id = auth.uid() or public.is_admin());
create policy profile_private_own_update on public.profile_private_data for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy profile_private_own_insert on public.profile_private_data for insert with check (user_id = auth.uid());
create policy roles_own_read on public.user_roles for select using (user_id = auth.uid() or public.is_admin());
create policy roles_admin_manage on public.user_roles for all using (public.is_admin()) with check (public.is_admin());
create policy site_settings_public_read on public.site_settings for select using (true);
create policy site_settings_admin_manage on public.site_settings for all using (public.is_admin()) with check (public.is_admin());
create policy flags_public_read on public.feature_flags for select using (true);
create policy flags_admin_manage on public.feature_flags for all using (public.is_admin()) with check (public.is_admin());

create policy services_public_read on public.services for select using (active or public.is_staff());
create policy packages_public_read on public.service_packages for select using (active or public.is_staff());
create policy addons_public_read on public.service_addons for select using (active or public.is_staff());
create policy services_staff_manage on public.services for all using (public.is_staff()) with check (public.is_staff());
create policy packages_staff_manage on public.service_packages for all using (public.is_staff()) with check (public.is_staff());
create policy addons_staff_manage on public.service_addons for all using (public.is_staff()) with check (public.is_staff());
create policy availability_staff_only on public.availability_rules for all using (public.is_staff()) with check (public.is_staff());
create policy exceptions_staff_only on public.availability_exceptions for all using (public.is_staff()) with check (public.is_staff());
create policy blocks_staff_only on public.blocked_periods for all using (public.is_staff()) with check (public.is_staff());

create policy leads_owner_or_staff_read on public.leads for select using (user_id = auth.uid() or public.is_staff());
create policy leads_staff_manage on public.leads for all using (public.is_staff()) with check (public.is_staff());
create policy quotes_client_read on public.quotes for select using (client_id = auth.uid() or public.is_staff());
create policy quotes_staff_manage on public.quotes for all using (public.is_staff()) with check (public.is_staff());
create policy quote_items_authorized_read on public.quote_items for select using (exists(select 1 from public.quotes q where q.id = quote_id and (q.client_id = auth.uid() or public.is_staff())));
create policy quote_items_staff_manage on public.quote_items for all using (public.is_staff()) with check (public.is_staff());
create policy bookings_client_read on public.bookings for select using (client_id = auth.uid() or public.is_staff());
create policy bookings_staff_manage on public.bookings for all using (public.is_staff()) with check (public.is_staff());
create policy booking_addons_authorized_read on public.booking_addons for select using (exists(select 1 from public.bookings b where b.id = booking_id and (b.client_id = auth.uid() or public.is_staff())));
create policy booking_addons_staff_manage on public.booking_addons for all using (public.is_staff()) with check (public.is_staff());
create policy payments_owner_read on public.payments for select using (customer_id = auth.uid() or public.is_staff());
create policy payments_staff_manage on public.payments for all using (public.is_staff()) with check (public.is_staff());

create policy projects_member_read on public.projects for select using (public.is_staff() or exists(select 1 from public.project_members pm where pm.project_id = id and pm.user_id = auth.uid()));
create policy projects_staff_manage on public.projects for all using (public.is_staff()) with check (public.is_staff());
create policy project_members_self_read on public.project_members for select using (user_id = auth.uid() or public.is_staff());
create policy project_members_staff_manage on public.project_members for all using (public.is_staff()) with check (public.is_staff());
create policy updates_member_read on public.project_updates for select using (public.is_staff() or (visible_to_client and exists(select 1 from public.project_members pm where pm.project_id = project_id and pm.user_id = auth.uid())));
create policy updates_staff_manage on public.project_updates for all using (public.is_staff()) with check (public.is_staff());
create policy deliverables_member_read on public.deliverables for select using (public.is_staff() or exists(select 1 from public.project_members pm where pm.project_id = project_id and pm.user_id = auth.uid()));
create policy deliverables_staff_manage on public.deliverables for all using (public.is_staff()) with check (public.is_staff());

create policy portfolio_public_read on public.portfolio_projects for select using ((status = 'PUBLISHED' and published_at <= now()) or public.is_staff());
create policy portfolio_staff_manage on public.portfolio_projects for all using (public.is_staff()) with check (public.is_staff());
create policy portfolio_media_public_read on public.portfolio_media for select using (exists(select 1 from public.portfolio_projects p where p.id = project_id and ((p.status = 'PUBLISHED' and p.published_at <= now()) or public.is_staff())));
create policy portfolio_media_staff_manage on public.portfolio_media for all using (public.is_staff()) with check (public.is_staff());
create policy categories_public_read on public.article_categories for select using (true);
create policy articles_public_read on public.articles for select using ((status = 'PUBLISHED' and published_at <= now()) or public.is_staff());
create policy articles_staff_manage on public.articles for all using (public.is_staff()) with check (public.is_staff());
create policy tags_public_read on public.tags for select using (true);
create policy article_tags_public_read on public.article_tags for select using (true);
create policy editorial_taxonomy_staff_manage on public.article_categories for all using (public.is_staff()) with check (public.is_staff());
create policy tags_staff_manage on public.tags for all using (public.is_staff()) with check (public.is_staff());
create policy article_tags_staff_manage on public.article_tags for all using (public.is_staff()) with check (public.is_staff());
create policy shows_public_read on public.shows for select using ((status = 'PUBLISHED' and published_at <= now()) or public.is_staff());
create policy videos_public_read on public.videos for select using ((status = 'PUBLISHED' and published_at <= now()) or public.is_staff());
create policy live_public_read on public.live_streams for select using (true);
create policy shows_staff_manage on public.shows for all using (public.is_staff()) with check (public.is_staff());
create policy videos_staff_manage on public.videos for all using (public.is_staff()) with check (public.is_staff());
create policy live_staff_manage on public.live_streams for all using (public.is_staff()) with check (public.is_staff());

create policy forum_categories_public_read on public.forum_categories for select using (active or public.is_staff());
create policy forum_posts_public_read on public.forum_posts for select using (status = 'PUBLISHED' or author_id = auth.uid() or public.is_staff());
create policy forum_posts_member_create on public.forum_posts for insert to authenticated with check (author_id = auth.uid());
create policy forum_posts_owner_update on public.forum_posts for update to authenticated using (author_id = auth.uid() or public.is_staff()) with check (author_id = auth.uid() or public.is_staff());
create policy comments_public_read on public.comments for select using (status = 'PUBLISHED' or author_id = auth.uid() or public.is_staff());
create policy comments_member_create on public.comments for insert to authenticated with check (author_id = auth.uid());
create policy comments_owner_update on public.comments for update to authenticated using (author_id = auth.uid() or public.is_staff()) with check (author_id = auth.uid() or public.is_staff());
create policy reactions_public_read on public.reactions for select using (true);
create policy reactions_own_manage on public.reactions for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy bookmarks_own_manage on public.bookmarks for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy forum_categories_staff_manage on public.forum_categories for all using (public.is_staff()) with check (public.is_staff());

create policy opportunities_public_read on public.opportunities for select using ((status = 'PUBLISHED' and published_at <= now()) or public.is_staff());
create policy events_public_read on public.events for select using ((status = 'PUBLISHED' and published_at <= now()) or public.is_staff());
create policy opportunities_staff_manage on public.opportunities for all using (public.is_staff()) with check (public.is_staff());
create policy events_staff_manage on public.events for all using (public.is_staff()) with check (public.is_staff());

create policy conversation_participant_read on public.conversations for select using (public.is_staff() or exists(select 1 from public.conversation_participants cp where cp.conversation_id = id and cp.user_id = auth.uid()));
create policy conversations_staff_manage on public.conversations for all using (public.is_staff()) with check (public.is_staff());
create policy participants_self_read on public.conversation_participants for select using (user_id = auth.uid() or public.is_staff());
create policy participants_staff_manage on public.conversation_participants for all using (public.is_staff()) with check (public.is_staff());
create policy messages_participant_read on public.messages for select using (public.is_staff() or exists(select 1 from public.conversation_participants cp where cp.conversation_id = conversation_id and cp.user_id = auth.uid()));
create policy messages_participant_create on public.messages for insert to authenticated with check (sender_id = auth.uid() and exists(select 1 from public.conversation_participants cp where cp.conversation_id = conversation_id and cp.user_id = auth.uid()));
create policy messages_staff_manage on public.messages for all using (public.is_staff()) with check (public.is_staff());

create policy reports_own_create on public.reports for insert to authenticated with check (reporter_id = auth.uid());
create policy reports_own_or_moderator_read on public.reports for select using (reporter_id = auth.uid() or has_role('MODERATOR') or public.is_admin());
create policy reports_moderator_manage on public.reports for update using (has_role('MODERATOR') or public.is_admin()) with check (has_role('MODERATOR') or public.is_admin());
create policy moderation_staff_only on public.moderation_actions for all using (has_role('MODERATOR') or public.is_admin()) with check (has_role('MODERATOR') or public.is_admin());
create policy notifications_own_read on public.notifications for select using (user_id = auth.uid());
create policy notifications_own_update on public.notifications for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy newsletter_staff_only on public.newsletter_subscribers for all using (public.is_admin()) with check (public.is_admin());
create policy testimonials_public_read on public.testimonials for select using (approved or public.is_staff());
create policy testimonials_staff_manage on public.testimonials for all using (public.is_staff()) with check (public.is_staff());
create policy audit_admin_read on public.audit_logs for select using (public.is_admin());

-- Sensitive provider/event tables intentionally have no browser policies. Service role bypasses RLS.
revoke all on public.stripe_events from anon, authenticated;

-- Storage: public editorial assets are readable; private assets require project membership or staff via signed server URLs.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
  ('public-media','public-media',true,26214400,array['image/jpeg','image/png','image/webp','image/avif','video/mp4']),
  ('private-deliverables','private-deliverables',false,1073741824,array['image/jpeg','image/png','image/webp','video/mp4','application/pdf','application/zip']),
  ('private-attachments','private-attachments',false,52428800,array['image/jpeg','image/png','image/webp','application/pdf'])
on conflict (id) do nothing;
create policy public_media_read on storage.objects for select using (bucket_id = 'public-media');
create policy staff_public_media_manage on storage.objects for all to authenticated using (bucket_id = 'public-media' and public.is_staff()) with check (bucket_id = 'public-media' and public.is_staff());

-- Realtime publication is limited to messaging tables; RLS still controls row delivery.
alter publication supabase_realtime add table public.conversations;
alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.notifications;
