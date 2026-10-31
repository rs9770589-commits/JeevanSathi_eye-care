-- Roles
create type public.app_role as enum ('admin','doctor','health_worker','patient');

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role public.app_role not null,
  unique (user_id, role)
);

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.user_roles where user_id = _user_id and role = _role) $$;

grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;
create policy "users read own roles, admins read all"
  on public.user_roles for select to authenticated
  using (user_id = auth.uid() or public.has_role(auth.uid(),'admin'));
create policy "admins manage roles"
  on public.user_roles for all to authenticated
  using (public.has_role(auth.uid(),'admin'))
  with check (public.has_role(auth.uid(),'admin'));

-- Profiles
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  phone text,
  language text not null default 'en',
  created_at timestamptz not null default now()
);
grant select, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;
create policy "read own or staff/admin"
  on public.profiles for select to authenticated
  using (id = auth.uid() or public.has_role(auth.uid(),'admin')
    or public.has_role(auth.uid(),'doctor') or public.has_role(auth.uid(),'health_worker'));
create policy "update own"
  on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

-- Profile + role bootstrap on signup. The very first account becomes admin.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, phone)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name',''), new.phone)
  on conflict (id) do nothing;
  insert into public.user_roles (user_id, role)
  select new.id, case when not exists (select 1 from public.user_roles) then 'admin'::public.app_role else 'patient'::public.app_role end;
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users
for each row execute function public.handle_new_user();

-- Patients
create sequence if not exists public.patient_code_seq;
grant usage, select on sequence public.patient_code_seq to authenticated;

create table public.patients (
  id uuid primary key default gen_random_uuid(),
  patient_code text not null unique,
  full_name text not null,
  age int,
  gender text check (gender in ('male','female','other')),
  phone text,
  village text,
  district text,
  language text not null default 'en',
  consent_given boolean not null default false,
  consent_at timestamptz,
  auth_user_id uuid references public.profiles(id) on delete set null,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create or replace function public.assign_patient_code()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.patient_code is null or new.patient_code = '' then
    new.patient_code := 'JS' || to_char(now(),'YYMM') || '-' || lpad(nextval('public.patient_code_seq')::text, 5, '0');
  end if;
  return new;
end $$;
create trigger trg_assign_patient_code before insert on public.patients
for each row execute function public.assign_patient_code();

grant select, insert, update on public.patients to authenticated;
grant all on public.patients to service_role;
alter table public.patients enable row level security;
create policy "staff read all, owners read own"
  on public.patients for select to authenticated
  using (auth_user_id = auth.uid() or created_by = auth.uid()
    or public.has_role(auth.uid(),'admin') or public.has_role(auth.uid(),'doctor')
    or public.has_role(auth.uid(),'health_worker'));
create policy "staff or self register patients"
  on public.patients for insert to authenticated
  with check (created_by = auth.uid() or auth_user_id = auth.uid()
    or public.has_role(auth.uid(),'admin') or public.has_role(auth.uid(),'health_worker'));
create policy "staff or owner update"
  on public.patients for update to authenticated
  using (auth_user_id = auth.uid() or created_by = auth.uid()
    or public.has_role(auth.uid(),'admin') or public.has_role(auth.uid(),'doctor')
    or public.has_role(auth.uid(),'health_worker'));

-- Screening cases
create table public.screening_cases (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid references public.patients(id) on delete cascade not null,
  status text not null default 'awaiting_images'
    check (status in ('awaiting_images','pending_review','in_review','completed','referred')),
  assigned_doctor uuid references public.profiles(id),
  created_by uuid references public.profiles(id),
  doctor_observation text,
  recommendation text check (recommendation in ('no_further_action','recheck','further_examination')),
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;
create trigger trg_touch_screening_case before update on public.screening_cases
for each row execute function public.touch_updated_at();

grant select, insert, update on public.screening_cases to authenticated;
grant all on public.screening_cases to service_role;
alter table public.screening_cases enable row level security;
create policy "staff read all, patient reads own"
  on public.screening_cases for select to authenticated
  using (exists (select 1 from public.patients p where p.id = patient_id
      and (p.auth_user_id = auth.uid() or p.created_by = auth.uid()))
    or public.has_role(auth.uid(),'admin') or public.has_role(auth.uid(),'doctor')
    or public.has_role(auth.uid(),'health_worker'));
create policy "staff or owning patient create"
  on public.screening_cases for insert to authenticated
  with check (exists (select 1 from public.patients p where p.id = patient_id
      and (p.auth_user_id = auth.uid() or p.created_by = auth.uid()))
    or public.has_role(auth.uid(),'admin') or public.has_role(auth.uid(),'health_worker'));
create policy "staff update"
  on public.screening_cases for update to authenticated
  using (public.has_role(auth.uid(),'admin') or public.has_role(auth.uid(),'doctor')
    or public.has_role(auth.uid(),'health_worker'));

-- Case images
create table public.case_images (
  id uuid primary key default gen_random_uuid(),
  case_id uuid references public.screening_cases(id) on delete cascade not null,
  storage_path text not null,
  image_type text not null default 'other' check (image_type in ('cheek','tongue','palate','other')),
  quality_status text not null default 'ok' check (quality_status in ('ok','needs_retake')),
  quality_note text,
  uploaded_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);
grant select, insert, delete on public.case_images to authenticated;
grant all on public.case_images to service_role;
alter table public.case_images enable row level security;
create policy "read via staff or case owner"
  on public.case_images for select to authenticated
  using (exists (select 1 from public.screening_cases c join public.patients p on p.id = c.patient_id
      where c.id = case_id and (p.auth_user_id = auth.uid() or p.created_by = auth.uid()))
    or public.has_role(auth.uid(),'admin') or public.has_role(auth.uid(),'doctor')
    or public.has_role(auth.uid(),'health_worker'));
create policy "upload via staff or case owner"
  on public.case_images for insert to authenticated
  with check (exists (select 1 from public.screening_cases c join public.patients p on p.id = c.patient_id
      where c.id = case_id and (p.auth_user_id = auth.uid() or p.created_by = auth.uid()))
    or public.has_role(auth.uid(),'admin') or public.has_role(auth.uid(),'health_worker'));
create policy "delete via staff or uploader"
  on public.case_images for delete to authenticated
  using (uploaded_by = auth.uid() or public.has_role(auth.uid(),'admin')
    or public.has_role(auth.uid(),'doctor') or public.has_role(auth.uid(),'health_worker'));

-- Referrals
create table public.referrals (
  id uuid primary key default gen_random_uuid(),
  case_id uuid references public.screening_cases(id) on delete cascade not null,
  facility text not null,
  status text not null default 'pending' check (status in ('pending','scheduled','attended','cancelled')),
  appointment_at timestamptz,
  notes text,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_touch_referral before update on public.referrals
for each row execute function public.touch_updated_at();
grant select, insert, update on public.referrals to authenticated;
grant all on public.referrals to service_role;
alter table public.referrals enable row level security;
create policy "read via staff or case owner"
  on public.referrals for select to authenticated
  using (exists (select 1 from public.screening_cases c join public.patients p on p.id = c.patient_id
      where c.id = case_id and (p.auth_user_id = auth.uid() or p.created_by = auth.uid()))
    or public.has_role(auth.uid(),'admin') or public.has_role(auth.uid(),'doctor')
    or public.has_role(auth.uid(),'health_worker'));
create policy "doctor/admin manage referrals"
  on public.referrals for all to authenticated
  using (public.has_role(auth.uid(),'admin') or public.has_role(auth.uid(),'doctor'))
  with check (public.has_role(auth.uid(),'admin') or public.has_role(auth.uid(),'doctor'));

-- Follow-up tasks
create table public.followup_tasks (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid references public.patients(id) on delete cascade not null,
  case_id uuid references public.screening_cases(id) on delete set null,
  assigned_to uuid references public.profiles(id),
  title text not null,
  details text,
  due_at timestamptz,
  status text not null default 'open' check (status in ('open','done','cancelled')),
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  completed_at timestamptz
);
grant select, insert, update on public.followup_tasks to authenticated;
grant all on public.followup_tasks to service_role;
alter table public.followup_tasks enable row level security;
create policy "staff read tasks"
  on public.followup_tasks for select to authenticated
  using (public.has_role(auth.uid(),'admin') or public.has_role(auth.uid(),'doctor')
    or public.has_role(auth.uid(),'health_worker'));
create policy "staff create tasks"
  on public.followup_tasks for insert to authenticated
  with check (public.has_role(auth.uid(),'admin') or public.has_role(auth.uid(),'doctor')
    or public.has_role(auth.uid(),'health_worker'));
create policy "staff update tasks"
  on public.followup_tasks for update to authenticated
  using (public.has_role(auth.uid(),'admin') or public.has_role(auth.uid(),'doctor')
    or public.has_role(auth.uid(),'health_worker') or assigned_to = auth.uid());

-- In-app notifications
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  body text,
  link text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
grant select, update on public.notifications to authenticated;
grant all on public.notifications to service_role;
alter table public.notifications enable row level security;
create policy "read own notifications"
  on public.notifications for select to authenticated using (user_id = auth.uid());
create policy "mark own notifications read"
  on public.notifications for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Notify the patient's linked account when a doctor reviews or a referral is scheduled
create or replace function public.notify_case_event()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_user uuid; v_patient uuid;
begin
  if tg_table_name = 'screening_cases' then
    v_patient := new.patient_id;
    if new.status in ('completed','referred') and (old.status is distinct from new.status) then
      select auth_user_id into v_user from public.patients where id = v_patient;
      if v_user is not null then
        insert into public.notifications (user_id, title, body, link)
        values (v_user,
          case when new.status = 'completed' then 'Your screening result is ready' else 'Your case was referred' end,
          case when new.status = 'completed' then 'A doctor has reviewed your photos. Open your portal to see the result.'
               else 'A doctor has recommended a further examination. Details are in your portal.' end,
          '/patient');
      end if;
    end if;
  elsif tg_table_name = 'referrals' then
    select p.auth_user_id into v_user
    from public.screening_cases c join public.patients p on p.id = c.patient_id where c.id = new.case_id;
    if v_user is not null and new.appointment_at is not null and (old.appointment_at is distinct from new.appointment_at or old.id is null) then
      insert into public.notifications (user_id, title, body, link)
      values (v_user, 'Appointment scheduled', 'Your hospital visit is scheduled. Check your portal for the date and place.', '/patient');
    end if;
  end if;
  return null;
end $$;
create trigger trg_notify_case after insert or update on public.screening_cases
for each row execute function public.notify_case_event();
create trigger trg_notify_referral after insert or update on public.referrals
for each row execute function public.notify_case_event();

-- Private image storage policies
create policy "oral-images read"
  on storage.objects for select to authenticated
  using (bucket_id = 'oral-images' and exists (
    select 1 from public.patients p
    where (storage.foldername(name))[1] = p.id::text
      and (p.auth_user_id = auth.uid() or p.created_by = auth.uid()
        or public.has_role(auth.uid(),'admin') or public.has_role(auth.uid(),'doctor')
        or public.has_role(auth.uid(),'health_worker'))));
create policy "oral-images upload"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'oral-images' and exists (
    select 1 from public.patients p
    where (storage.foldername(name))[1] = p.id::text
      and (p.auth_user_id = auth.uid() or p.created_by = auth.uid()
        or public.has_role(auth.uid(),'admin') or public.has_role(auth.uid(),'health_worker'))));
create policy "oral-images delete"
  on storage.objects for delete to authenticated
  using (bucket_id = 'oral-images' and exists (
    select 1 from public.patients p
    where (storage.foldername(name))[1] = p.id::text
      and (p.auth_user_id = auth.uid() or p.created_by = auth.uid()
        or public.has_role(auth.uid(),'admin'))));
