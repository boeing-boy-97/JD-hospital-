-- Phase 2 hardening migration. Run after schema.sql.
create sequence if not exists appointment_number_seq start 1;
create sequence if not exists enquiry_number_seq start 1;

alter table doctor_schedules add column if not exists active boolean not null default true;
alter table appointments add column if not exists access_token uuid unique default gen_random_uuid();
alter table appointments add column if not exists idempotency_key uuid unique;
alter table enquiries add column if not exists reference_number text unique;
create table if not exists homecare_requests (
 id uuid primary key default gen_random_uuid(), reference_number text unique not null,
 service_id uuid references homecare_services, location text not null, preferred_date date not null,
 preferred_time time not null, patient_name text not null, phone text not null, email text,
 notes text, status text not null default 'new' check(status in ('new','contacted','scheduled','completed','cancelled')),
 created_at timestamptz default now(), updated_at timestamptz default now()
);
create table if not exists admin_activity_logs (
 id uuid primary key default gen_random_uuid(), admin_id uuid references auth.users,
 action text not null, entity_type text not null, entity_id uuid, metadata jsonb default '{}',
 created_at timestamptz default now()
);
alter table homecare_requests enable row level security;
alter table admin_activity_logs enable row level security;
create policy "admin manages homecare" on homecare_requests for all using(is_admin()) with check(is_admin());
create policy "admin reads activity" on admin_activity_logs for select using(is_admin());

-- A cancelled appointment does not block a slot; every other status does.
create unique index if not exists appointments_live_slot_unique
on appointments(doctor_id,hospital_id,appointment_date,appointment_time)
where status <> 'cancelled';
create index if not exists schedules_lookup_idx on doctor_schedules(doctor_id,hospital_id,weekday,active);
create index if not exists appointments_slot_lookup_idx on appointments(doctor_id,hospital_id,appointment_date,status);
create index if not exists hospitals_city_idx on hospitals(city);
create index if not exists packages_filter_idx on health_packages(hospital_id,category,status,price);
create index if not exists enquiries_status_idx on enquiries(status,created_at desc);

create or replace function available_doctor_slots(p_doctor uuid,p_hospital uuid,p_date date)
returns table(slot time) language sql stable security definer set search_path=public as $$
 with schedule as (
  select start_time,end_time,slot_minutes from doctor_schedules
  where doctor_id=p_doctor and hospital_id=p_hospital and weekday=extract(dow from p_date)::int and active=true
 ), generated as (
  select gs::time slot from schedule s, lateral generate_series(
   p_date+s.start_time, p_date+s.end_time-(s.slot_minutes||' minutes')::interval,
   (s.slot_minutes||' minutes')::interval) gs
 )
 select g.slot from generated g where not exists(
  select 1 from appointments a where a.doctor_id=p_doctor and a.hospital_id=p_hospital
  and a.appointment_date=p_date and a.appointment_time=g.slot and a.status<>'cancelled'
 ) order by g.slot;
$$;

create or replace function book_appointment(
 p_idempotency_key uuid,p_patient_name text,p_patient_phone text,p_patient_email text,p_dob date,p_gender text,
 p_hospital uuid,p_specialty uuid,p_doctor uuid,p_date date,p_time time,p_consultation text,p_reason text,p_language text)
returns table(appointment_number text,access_token uuid) language plpgsql security definer set search_path=public as $$
declare v_number text; v_token uuid; v_existing appointments%rowtype;
begin
 if p_date<current_date then raise exception 'INVALID_DATE'; end if;
 select * into v_existing from appointments where idempotency_key=p_idempotency_key;
 if found then return query select v_existing.appointment_number,v_existing.access_token; return; end if;
 if not exists(select 1 from available_doctor_slots(p_doctor,p_hospital,p_date) s where s.slot=p_time) then raise exception 'SLOT_UNAVAILABLE'; end if;
 v_number:='APT-'||extract(year from current_date)::int||'-'||lpad(nextval('appointment_number_seq')::text,6,'0');
 v_token:=gen_random_uuid();
 insert into appointments(appointment_number,access_token,idempotency_key,patient_name,patient_phone,patient_email,date_of_birth,gender,hospital_id,specialty_id,doctor_id,appointment_date,appointment_time,consultation_type,reason,preferred_language,status)
 values(v_number,v_token,p_idempotency_key,p_patient_name,p_patient_phone,nullif(p_patient_email,''),p_dob,p_gender,p_hospital,p_specialty,p_doctor,p_date,p_time,p_consultation,p_reason,p_language,'pending');
 return query select v_number,v_token;
exception when unique_violation then raise exception 'SLOT_UNAVAILABLE';
end $$;
revoke all on function book_appointment from public,anon,authenticated;
revoke all on function available_doctor_slots from public,anon,authenticated;

create or replace function log_admin_action() returns trigger language plpgsql security definer set search_path=public as $$
begin insert into admin_activity_logs(admin_id,action,entity_type,entity_id) values(auth.uid(),tg_op,replace(tg_table_name,'_',' '),coalesce(new.id,old.id)); return coalesce(new,old); end $$;
create trigger appointment_admin_audit after update on appointments for each row when (old.* is distinct from new.*) execute function log_admin_action();

-- Phase 2 media aliases; private resumes never receive a public read policy.
insert into storage.buckets(id,name,public) values
('doctors','doctors',true),('hospitals','hospitals',true),('articles','articles',true),
('services','services',true),('packages','packages',true),('videos','videos',true),
('documents-v2','documents-v2',true),('resumes','resumes',false)
on conflict(id) do nothing;

-- Track content and operational changes made through authenticated admin sessions.
do $$ declare t text; begin
 foreach t in array array['doctors','hospitals','specialties','services','health_packages','articles','videos','jobs','insurance_providers','clinics','enquiries','homecare_requests'] loop
  if not exists(select 1 from pg_trigger where tgname=t||'_admin_audit') then
   execute format('create trigger %I after insert or update or delete on %I for each row execute function log_admin_action()',t||'_admin_audit',t);
  end if;
 end loop;
end $$;
