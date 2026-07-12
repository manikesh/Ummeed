-- =====================================================================
-- Ummeed - Complete Database Schema
-- Run this in your Supabase project SQL Editor (one shot)
-- Project ref: vlztioqltxykcusrxsmi
-- =====================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------
-- 1) Roles & verification status enums
-- ---------------------------------------------------------------------
do $$ begin
  create type public.app_role as enum (
    'patient','doctor','ngo','counselor','legal_aid','volunteer','admin'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.verification_status as enum ('pending','approved','rejected');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.connection_status as enum ('pending','accepted','declined');
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------
-- 2) profiles  (one row per auth.users)
-- ---------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role public.app_role not null default 'patient',
  full_name text,
  phone text,
  avatar_path text,
  city text,
  state text,
  verification_status public.verification_status not null default 'approved',
  -- patient-specific
  age int,
  gender text,
  emergency_contact_name text,
  emergency_contact_phone text,
  -- doctor-specific
  license_number text,
  specialization text,
  hospital_id uuid,
  -- ngo / legal / counselor specific
  organization_name text,
  registration_number text,
  address text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists profiles_role_idx on public.profiles(role);
create index if not exists profiles_verification_idx on public.profiles(verification_status);
create unique index if not exists profiles_phone_unique on public.profiles(phone) where phone is not null;

-- ---------------------------------------------------------------------
-- 3) hospitals  (admin-managed)
-- ---------------------------------------------------------------------
create table if not exists public.hospitals (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text,
  city text,
  state text,
  phone text,
  email text,
  has_burn_unit boolean default false,
  is_active boolean default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists hospitals_city_idx on public.hospitals(city);
create index if not exists hospitals_state_idx on public.hospitals(state);

-- ---------------------------------------------------------------------
-- 4) burn_incidents
-- ---------------------------------------------------------------------
create table if not exists public.burn_incidents (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.profiles(id) on delete cascade,
  incident_date date,
  burn_type text,             -- 'acid','flame','electrical','scald','other'
  body_part text,
  severity text,              -- '1st_degree','2nd_degree','3rd_degree'
  description text,
  location text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists burn_incidents_patient_idx on public.burn_incidents(patient_id);

-- ---------------------------------------------------------------------
-- 5) medical_records (text rows + optional file in storage)
-- ---------------------------------------------------------------------
create table if not exists public.medical_records (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.profiles(id) on delete cascade,
  created_by uuid references public.profiles(id) on delete set null,
  title text not null,
  notes text,
  file_path text,
  mime_type text,
  file_size bigint,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists medical_records_patient_idx on public.medical_records(patient_id);

-- ---------------------------------------------------------------------
-- 6) connections (patient <-> provider request)
-- ---------------------------------------------------------------------
create table if not exists public.connections (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.profiles(id) on delete cascade,
  provider_id uuid not null references public.profiles(id) on delete cascade,
  message text,
  status public.connection_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (patient_id, provider_id)
);

create index if not exists connections_patient_idx on public.connections(patient_id);
create index if not exists connections_provider_idx on public.connections(provider_id);

-- ---------------------------------------------------------------------
-- 7) content_items (admin-managed: first_aid, news, scheme, helpline, remedy)
-- ---------------------------------------------------------------------
create table if not exists public.content_items (
  id uuid primary key default gen_random_uuid(),
  category text not null,           -- 'first_aid' | 'remedy' | 'news' | 'scheme' | 'helpline' | 'video'
  title text not null,
  body text,
  url text,                          -- for videos / news / scheme links
  phone text,                        -- for helplines
  is_published boolean default false,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists content_items_category_idx on public.content_items(category);
create index if not exists content_items_published_idx on public.content_items(is_published);

-- ---------------------------------------------------------------------
-- 8) updated_at trigger
-- ---------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end; $$;

do $$ begin
  create trigger trg_profiles_updated_at before update on public.profiles
    for each row execute function public.set_updated_at();
exception when duplicate_object then null; end $$;
do $$ begin
  create trigger trg_hospitals_updated_at before update on public.hospitals
    for each row execute function public.set_updated_at();
exception when duplicate_object then null; end $$;
do $$ begin
  create trigger trg_burn_incidents_updated_at before update on public.burn_incidents
    for each row execute function public.set_updated_at();
exception when duplicate_object then null; end $$;
do $$ begin
  create trigger trg_medical_records_updated_at before update on public.medical_records
    for each row execute function public.set_updated_at();
exception when duplicate_object then null; end $$;
do $$ begin
  create trigger trg_connections_updated_at before update on public.connections
    for each row execute function public.set_updated_at();
exception when duplicate_object then null; end $$;
do $$ begin
  create trigger trg_content_items_updated_at before update on public.content_items
    for each row execute function public.set_updated_at();
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------
-- 9) Auto-create profile on signup
--    role is read from user_metadata; doctor/ngo/etc start as 'pending'
-- ---------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  desired_role public.app_role;
  v_status public.verification_status;
begin
  desired_role := case
    when (new.raw_user_meta_data->>'role') in
      ('patient','doctor','ngo','counselor','legal_aid','volunteer','admin')
      then (new.raw_user_meta_data->>'role')::public.app_role
    else 'patient'
  end;

  v_status := case
    when desired_role = 'patient' then 'approved'::public.verification_status
    else 'pending'::public.verification_status
  end;

  insert into public.profiles (id, role, full_name, phone, verification_status)
  values (
    new.id,
    desired_role,
    nullif(new.raw_user_meta_data->>'full_name',''),
    nullif(new.raw_user_meta_data->>'phone',''),
    v_status
  )
  on conflict (id) do nothing;
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------
-- 10) Helper: is_admin()
-- ---------------------------------------------------------------------
create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'
  );
$$;

-- ---------------------------------------------------------------------
-- 11) Grants
-- ---------------------------------------------------------------------
grant usage on schema public to anon, authenticated;
grant select on public.hospitals to anon, authenticated;
grant select on public.content_items to anon, authenticated;
grant select, insert, update, delete on public.profiles to authenticated;
grant select, insert, update, delete on public.burn_incidents to authenticated;
grant select, insert, update, delete on public.medical_records to authenticated;
grant select, insert, update, delete on public.connections to authenticated;
grant select, insert, update, delete on public.hospitals to authenticated;
grant select, insert, update, delete on public.content_items to authenticated;

-- ---------------------------------------------------------------------
-- 12) Row Level Security
-- ---------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.hospitals enable row level security;
alter table public.burn_incidents enable row level security;
alter table public.medical_records enable row level security;
alter table public.connections enable row level security;
alter table public.content_items enable row level security;

-- ----- PROFILES policies -----
drop policy if exists profiles_select_all_auth on public.profiles;
create policy profiles_select_all_auth on public.profiles for select to authenticated
  using (true);  -- patients need to find providers; provider info is non-sensitive

drop policy if exists profiles_insert_self on public.profiles;
create policy profiles_insert_self on public.profiles for insert to authenticated
  with check (id = auth.uid());

drop policy if exists profiles_update_self_or_admin on public.profiles;
create policy profiles_update_self_or_admin on public.profiles for update to authenticated
  using (id = auth.uid() or public.is_admin())
  with check (id = auth.uid() or public.is_admin());

drop policy if exists profiles_delete_admin on public.profiles;
create policy profiles_delete_admin on public.profiles for delete to authenticated
  using (public.is_admin());

-- ----- HOSPITALS policies -----
drop policy if exists hospitals_select_all on public.hospitals;
create policy hospitals_select_all on public.hospitals for select
  using (is_active = true or public.is_admin());

drop policy if exists hospitals_write_admin on public.hospitals;
create policy hospitals_write_admin on public.hospitals for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- ----- CONTENT ITEMS policies -----
drop policy if exists content_select_all on public.content_items;
create policy content_select_all on public.content_items for select
  using (is_published = true or created_by = auth.uid() or public.is_admin());

drop policy if exists content_write_policy on public.content_items;
drop policy if exists content_insert_provider on public.content_items;
drop policy if exists content_update_owner_admin on public.content_items;
drop policy if exists content_delete_owner_admin on public.content_items;

create policy content_insert_provider on public.content_items for insert to authenticated
  with check (
    created_by = auth.uid()
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and p.role in ('doctor', 'ngo', 'counselor', 'legal_aid', 'admin')
        and p.verification_status = 'approved'
    )
    and (public.is_admin() or is_published = false)
  );

create policy content_update_owner_admin on public.content_items for update to authenticated
  using (created_by = auth.uid() or public.is_admin())
  with check (
    public.is_admin()
    or (
      created_by = auth.uid()
      and is_published = false
      and exists (
        select 1 from public.profiles p
        where p.id = auth.uid()
          and p.role in ('doctor', 'ngo', 'counselor', 'legal_aid', 'admin')
          and p.verification_status = 'approved'
      )
    )
  );

create policy content_delete_owner_admin on public.content_items for delete to authenticated
  using (created_by = auth.uid() or public.is_admin());

-- ----- BURN INCIDENTS policies -----
drop policy if exists incidents_select_self_admin on public.burn_incidents;
create policy incidents_select_self_admin on public.burn_incidents for select to authenticated
  using (
    patient_id = auth.uid()
    or public.is_admin()
    or exists (
      select 1 from public.connections c
      where c.patient_id = burn_incidents.patient_id
        and c.provider_id = auth.uid()
        and c.status = 'accepted'
    )
  );

drop policy if exists incidents_insert_self on public.burn_incidents;
create policy incidents_insert_self on public.burn_incidents for insert to authenticated
  with check (patient_id = auth.uid());

drop policy if exists incidents_update_self_admin on public.burn_incidents;
create policy incidents_update_self_admin on public.burn_incidents for update to authenticated
  using (patient_id = auth.uid() or public.is_admin())
  with check (patient_id = auth.uid() or public.is_admin());

drop policy if exists incidents_delete_self_admin on public.burn_incidents;
create policy incidents_delete_self_admin on public.burn_incidents for delete to authenticated
  using (patient_id = auth.uid() or public.is_admin());

-- ----- MEDICAL RECORDS policies -----
drop policy if exists records_select_patient_provider_admin on public.medical_records;
create policy records_select_patient_provider_admin on public.medical_records for select to authenticated
  using (
    patient_id = auth.uid()
    or public.is_admin()
    or exists (
      select 1 from public.connections c
      where c.patient_id = medical_records.patient_id
        and c.provider_id = auth.uid()
        and c.status = 'accepted'
    )
  );

drop policy if exists records_insert_patient_or_provider on public.medical_records;
create policy records_insert_patient_or_provider on public.medical_records for insert to authenticated
  with check (
    created_by = auth.uid()
    and (
      patient_id = auth.uid()
      or exists (
        select 1 from public.connections c
        where c.patient_id = medical_records.patient_id
          and c.provider_id = auth.uid()
          and c.status = 'accepted'
      )
      or public.is_admin()
    )
  );

drop policy if exists records_update_owner_or_admin on public.medical_records;
create policy records_update_owner_or_admin on public.medical_records for update to authenticated
  using (created_by = auth.uid() or patient_id = auth.uid() or public.is_admin())
  with check (created_by = auth.uid() or patient_id = auth.uid() or public.is_admin());

drop policy if exists records_delete_owner_or_admin on public.medical_records;
create policy records_delete_owner_or_admin on public.medical_records for delete to authenticated
  using (created_by = auth.uid() or patient_id = auth.uid() or public.is_admin());

-- ----- CONNECTIONS policies -----
drop policy if exists conn_select_involved_admin on public.connections;
create policy conn_select_involved_admin on public.connections for select to authenticated
  using (patient_id = auth.uid() or provider_id = auth.uid() or public.is_admin());

drop policy if exists conn_insert_patient on public.connections;
create policy conn_insert_patient on public.connections for insert to authenticated
  with check (patient_id = auth.uid());

drop policy if exists conn_update_provider_patient_admin on public.connections;
create policy conn_update_provider_patient_admin on public.connections for update to authenticated
  using (provider_id = auth.uid() or patient_id = auth.uid() or public.is_admin())
  with check (provider_id = auth.uid() or patient_id = auth.uid() or public.is_admin());

drop policy if exists conn_delete_patient_admin on public.connections;
create policy conn_delete_patient_admin on public.connections for delete to authenticated
  using (patient_id = auth.uid() or public.is_admin());

-- ---------------------------------------------------------------------
-- 13) Storage buckets + RLS
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values
  ('profile_photos', 'profile_photos', false),
  ('medical_records', 'medical_records', false)
on conflict (id) do nothing;

-- Profile photos: path is {uid}/...
drop policy if exists prof_photos_select on storage.objects;
create policy prof_photos_select on storage.objects for select to authenticated
  using (
    bucket_id = 'profile_photos'
    and (split_part(name,'/',1) = auth.uid()::text or public.is_admin())
  );

drop policy if exists prof_photos_write on storage.objects;
create policy prof_photos_write on storage.objects for insert to authenticated
  with check (bucket_id = 'profile_photos' and split_part(name,'/',1) = auth.uid()::text);

drop policy if exists prof_photos_update on storage.objects;
create policy prof_photos_update on storage.objects for update to authenticated
  using (bucket_id = 'profile_photos' and split_part(name,'/',1) = auth.uid()::text)
  with check (bucket_id = 'profile_photos' and split_part(name,'/',1) = auth.uid()::text);

drop policy if exists prof_photos_delete on storage.objects;
create policy prof_photos_delete on storage.objects for delete to authenticated
  using (bucket_id = 'profile_photos' and (split_part(name,'/',1) = auth.uid()::text or public.is_admin()));

-- Medical records: path {patient_uuid}/...
drop policy if exists mr_select on storage.objects;
create policy mr_select on storage.objects for select to authenticated
  using (
    bucket_id = 'medical_records'
    and (
      split_part(name,'/',1)::uuid = auth.uid()
      or public.is_admin()
      or exists (
        select 1 from public.connections c
        where c.patient_id = split_part(name,'/',1)::uuid
          and c.provider_id = auth.uid()
          and c.status = 'accepted'
      )
    )
  );

drop policy if exists mr_insert on storage.objects;
create policy mr_insert on storage.objects for insert to authenticated
  with check (
    bucket_id = 'medical_records'
    and (
      split_part(name,'/',1)::uuid = auth.uid()
      or public.is_admin()
      or exists (
        select 1 from public.connections c
        where c.patient_id = split_part(name,'/',1)::uuid
          and c.provider_id = auth.uid()
          and c.status = 'accepted'
      )
    )
  );

drop policy if exists mr_update on storage.objects;
create policy mr_update on storage.objects for update to authenticated
  using (
    bucket_id = 'medical_records'
    and (split_part(name,'/',1)::uuid = auth.uid() or public.is_admin())
  );

drop policy if exists mr_delete on storage.objects;
create policy mr_delete on storage.objects for delete to authenticated
  using (
    bucket_id = 'medical_records'
    and (split_part(name,'/',1)::uuid = auth.uid() or public.is_admin())
  );

-- Content media: public bucket for uploading helpful social information media
insert into storage.buckets (id, name, public)
values ('content_media', 'content_media', true)
on conflict (id) do nothing;

drop policy if exists content_media_select on storage.objects;
create policy content_media_select on storage.objects for select
  using (bucket_id = 'content_media');

drop policy if exists content_media_insert on storage.objects;
create policy content_media_insert on storage.objects for insert to authenticated
  with check (
    bucket_id = 'content_media'
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and p.role in ('doctor', 'ngo', 'counselor', 'legal_aid', 'admin')
        and p.verification_status = 'approved'
    )
  );

drop policy if exists content_media_delete on storage.objects;
create policy content_media_delete on storage.objects for delete to authenticated
  using (
    bucket_id = 'content_media'
    and (owner = auth.uid() or public.is_admin())
  );

-- ---------------------------------------------------------------------
-- 14) Seed: a few hospitals + emergency content (idempotent)
-- ---------------------------------------------------------------------
insert into public.hospitals (name, address, city, state, phone, has_burn_unit)
select * from (values
  ('Safdarjung Hospital - Burn Centre','Ansari Nagar West','New Delhi','Delhi','+911126707444',true),
  ('Ram Manohar Lohia Hospital - Burns & Plastic Surgery','Baba Kharak Singh Marg','New Delhi','Delhi','+911123404040',true),
  ('Lokmanya Tilak Municipal Hospital (Sion) - Burns Ward','Sion West','Mumbai','Maharashtra','+912224063000',true),
  ('Choithram Hospital Burns Unit','Manik Bagh Road','Indore','Madhya Pradesh','+917312362491',true),
  ('Kidwai Memorial Burns Unit','Hosur Road','Bengaluru','Karnataka','+918026094000',true)
) as t(name,address,city,state,phone,has_burn_unit)
where not exists (select 1 from public.hospitals h where h.name = t.name);

insert into public.content_items (category, title, body, phone, url, is_published)
select * from (values
  ('helpline','National Burn Helpline','24x7 burn-emergency helpline run by Govt. of India','1075',null,true),
  ('helpline','Sneha Foundation (Acid Attack Survivors)','Counseling and rehabilitation support','+919833052684',null,true),
  ('helpline','Stop Acid Attacks (SAA)','Survivor support network','+919582105106',null,true),
  ('first_aid','First Aid: Acid Burn','1) Move to safety. 2) Remove contaminated clothing. 3) Rinse the area with cool running water for at least 20 minutes. 4) Do NOT apply ointments, ice, or home remedies. 5) Cover loosely with clean cloth. 6) Reach the nearest burn unit immediately.',null,null,true),
  ('first_aid','First Aid: Flame / Scald Burn','1) Stop the burning. 2) Cool with running water for 20 minutes. 3) Cover with clean cloth. 4) Do not pop blisters. 5) Seek medical help.',null,null,true),
  ('remedy','Burn Care at Home: Do''s and Don''ts','DO keep wound clean, hydrate, take medication. DON''T apply toothpaste/butter/turmeric. DON''T pop blisters.',null,null,true),
  ('scheme','PM-JAY (Ayushman Bharat)','Cashless treatment up to Rs. 5 lakh per family per year at empanelled hospitals. Burn injury treatment is covered.',null,'https://pmjay.gov.in',true),
  ('scheme','Acid Attack Survivor Compensation','Under Sec 357A CrPC and Laxmi v. Union of India. Contact your DLSA.',null,'https://nalsa.gov.in',true),
  ('news','Acid Sale is Regulated','Sale of acid in India is regulated. Sellers must keep ID-proof records of buyers. Report illegal sales to police.',null,null,true),
  ('video','Burn First Aid (search)','Short explainer videos',null,'https://www.youtube.com/results?search_query=burn+first+aid',true)
) as t(category, title, body, phone, url, is_published)
where not exists (
  select 1 from public.content_items c where c.title = t.title
);

-- ---------------------------------------------------------------------
-- 15) Admin promotion helper (run manually once you know the user's email)
--   Example:
--   update public.profiles set role='admin', verification_status='approved'
--   where id = (select id from auth.users where email='admin@ummeed.org');
-- ---------------------------------------------------------------------
