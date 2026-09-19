-- Phase 3: auditable media, content provenance, slot records and package requests.
-- Run after schema.sql and phase2_hardening.sql.

create table if not exists content_sources (
 id uuid primary key default gen_random_uuid(),
 source_name text not null,
 source_url text not null,
 retrieved_at timestamptz not null,
 data_type text not null,
 license_or_usage_note text not null,
 created_at timestamptz not null default now(),
 unique(source_url,data_type)
);

create table if not exists media_assets (
 id uuid primary key default gen_random_uuid(),
 title text not null,
 url text,
 storage_path text,
 alt_text text not null,
 source_url text not null,
 source_name text not null,
 license text not null,
 photographer text,
 category text not null check(category in ('hero','hospital','doctor','specialty','service','package','article','facility','patient-story','technology','general')),
 width integer check(width is null or width>0),
 height integer check(height is null or height>0),
 focal_x numeric(5,2) default 50 check(focal_x between 0 and 100),
 focal_y numeric(5,2) default 50 check(focal_y between 0 and 100),
 status publication_status not null default 'draft',
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);

create table if not exists appointment_slots (
 id uuid primary key default gen_random_uuid(),
 doctor_id uuid not null references doctors on delete cascade,
 hospital_id uuid not null references hospitals on delete cascade,
 slot_date date not null,
 start_time time not null,
 end_time time not null,
 active boolean not null default true,
 blocked_reason text,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 unique(doctor_id,hospital_id,slot_date,start_time)
);

create table if not exists package_requests (
 id uuid primary key default gen_random_uuid(),
 reference_number text unique not null,
 package_id uuid not null references health_packages,
 hospital_id uuid not null references hospitals,
 preferred_date date not null,
 patient_name text not null,
 phone text not null,
 email text,
 status text not null default 'pending' check(status in ('pending','contacted','confirmed','cancelled','completed')),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);

alter table hospitals add column if not exists source_url text;
alter table hospitals add column if not exists source_name text;
alter table hospitals add column if not exists source_retrieved_at timestamptz;
alter table doctors add column if not exists source_url text;
alter table doctors add column if not exists source_name text;
alter table doctors add column if not exists source_retrieved_at timestamptz;
alter table specialties add column if not exists source_url text;
alter table specialties add column if not exists source_name text;
alter table specialties add column if not exists source_retrieved_at timestamptz;
alter table articles add column if not exists source_url text;
alter table articles add column if not exists source_name text;
alter table articles add column if not exists source_retrieved_at timestamptz;
alter table health_packages add column if not exists eligibility text;
alter table health_packages add column if not exists preparation text;

create index if not exists media_assets_category_status_idx on media_assets(category,status);
create index if not exists appointment_slots_lookup_idx on appointment_slots(doctor_id,hospital_id,slot_date,active);
create index if not exists package_requests_status_idx on package_requests(status,created_at desc);
create index if not exists articles_search_fts_idx on articles using gin(to_tsvector('english',coalesce(title,'')||' '||coalesce(excerpt,'')||' '||coalesce(content,'')));
create index if not exists hospitals_search_fts_idx on hospitals using gin(to_tsvector('simple',coalesce(name,'')||' '||coalesce(city,'')||' '||coalesce(address,'')));
create index if not exists specialties_search_fts_idx on specialties using gin(to_tsvector('english',coalesce(name,'')||' '||coalesce(overview,'')));

alter table content_sources enable row level security;
alter table media_assets enable row level security;
alter table appointment_slots enable row level security;
alter table package_requests enable row level security;

create policy "public reads published media" on media_assets for select using(status='published');
create policy "public reads sources" on content_sources for select using(true);
create policy "admin manages sources" on content_sources for all using(is_admin()) with check(is_admin());
create policy "admin manages media" on media_assets for all using(is_admin()) with check(is_admin());
create policy "admin manages slots" on appointment_slots for all using(is_admin()) with check(is_admin());
create policy "admin manages package requests" on package_requests for all using(is_admin()) with check(is_admin());

insert into content_sources(source_name,source_url,retrieved_at,data_type,license_or_usage_note) values
('Pexels — RDNE Stock project','https://www.pexels.com/photo/doctor-talking-to-a-patient-sitting-on-bed-6129040/','2026-09-19','hero image','Pexels License; illustrative editorial healthcare photography; no endorsement implied.'),
('Pexels — EVG Kowalievska','https://www.pexels.com/photo/three-person-looking-at-x-ray-result-1170979/','2026-09-19','clinical team image','Pexels License; illustrative editorial healthcare photography; no endorsement implied.'),
('Pexels — Mitchell Luo','https://www.pexels.com/photo/close-up-of-a-modern-building-facade-5898345/','2026-09-19','architecture image','Pexels License; illustrative architecture, not a JD Hospital location.')
on conflict(source_url,data_type) do nothing;

insert into media_assets(title,url,alt_text,source_url,source_name,license,photographer,category,width,height,focal_x,focal_y,status) values
('Doctor and patient consultation','/images/hero-consultation.jpg','Doctor consulting with a patient in a modern hospital room','https://www.pexels.com/photo/doctor-talking-to-a-patient-sitting-on-bed-6129040/','Pexels','Pexels License','RDNE Stock project','hero',1800,1200,55,45,'published'),
('Clinical team reviewing imaging','/images/clinical-team.jpg','Clinical team reviewing diagnostic imaging together','https://www.pexels.com/photo/three-person-looking-at-x-ray-result-1170979/','Pexels','Pexels License','EVG Kowalievska','technology',1600,1067,50,50,'published'),
('Modern building facade','/images/hospital-building.jpg','Illustrative modern healthcare building facade','https://www.pexels.com/photo/close-up-of-a-modern-building-facade-5898345/','Pexels','Pexels License','Mitchell Luo','hospital',1600,1067,50,50,'published')
on conflict do nothing;

create sequence if not exists package_request_number_seq start 1;
create or replace function create_package_request(p_package uuid,p_hospital uuid,p_date date,p_name text,p_phone text,p_email text)
returns text language plpgsql security definer set search_path=public as $$
declare v_ref text;
begin
 if p_date<current_date then raise exception 'INVALID_DATE'; end if;
 if not exists(select 1 from health_packages where id=p_package and hospital_id=p_hospital and status='published') then raise exception 'PACKAGE_UNAVAILABLE'; end if;
 v_ref:='PKG-'||extract(year from current_date)::int||'-'||lpad(nextval('package_request_number_seq')::text,6,'0');
 insert into package_requests(reference_number,package_id,hospital_id,preferred_date,patient_name,phone,email)
 values(v_ref,p_package,p_hospital,p_date,p_name,p_phone,nullif(p_email,''));
 return v_ref;
end $$;
revoke all on function create_package_request from public,anon,authenticated;

create or replace function global_search(p_query text,p_limit integer default 12)
returns table(entity_type text,id uuid,slug text,title text,subtitle text,search_rank real)
language sql stable security invoker set search_path=public as $$
 with q as (select websearch_to_tsquery('english',trim(p_query)) query), results as (
  select 'doctor'::text,d.id,d.slug,d.name,d.designation,
   ts_rank(to_tsvector('english',coalesce(d.name,'')||' '||coalesce(d.designation,'')),q.query)::real rank
  from doctors d,q where d.status='published' and to_tsvector('english',coalesce(d.name,'')||' '||coalesce(d.designation,''))@@q.query
  union all
  select 'hospital',h.id,h.slug,h.name,h.city,
   ts_rank(to_tsvector('english',coalesce(h.name,'')||' '||coalesce(h.city,'')||' '||coalesce(h.address,'')),q.query)::real
  from hospitals h,q where h.status='published' and to_tsvector('english',coalesce(h.name,'')||' '||coalesce(h.city,'')||' '||coalesce(h.address,''))@@q.query
  union all
  select 'specialty',s.id,s.slug,s.name,'Medical specialty',
   ts_rank(to_tsvector('english',coalesce(s.name,'')||' '||coalesce(s.overview,'')),q.query)::real
  from specialties s,q where s.status='published' and to_tsvector('english',coalesce(s.name,'')||' '||coalesce(s.overview,''))@@q.query
  union all
  select 'service',s.id,s.slug,s.name,'Clinical service',
   ts_rank(to_tsvector('english',coalesce(s.name,'')||' '||coalesce(s.description,'')),q.query)::real
  from services s,q where s.status='published' and to_tsvector('english',coalesce(s.name,'')||' '||coalesce(s.description,''))@@q.query
  union all
  select 'package',p.id,p.slug,p.name,p.category,
   ts_rank(to_tsvector('english',coalesce(p.name,'')||' '||coalesce(p.description,'')||' '||coalesce(p.category,'')),q.query)::real
  from health_packages p,q where p.status='published' and to_tsvector('english',coalesce(p.name,'')||' '||coalesce(p.description,'')||' '||coalesce(p.category,''))@@q.query
  union all
  select 'article',a.id,a.slug,a.title,a.author,
   ts_rank(to_tsvector('english',coalesce(a.title,'')||' '||coalesce(a.excerpt,'')||' '||coalesce(a.content,'')),q.query)::real
  from articles a,q where a.status='published' and to_tsvector('english',coalesce(a.title,'')||' '||coalesce(a.excerpt,'')||' '||coalesce(a.content,''))@@q.query
  union all
  select 'video',v.id,v.slug,v.title,v.category,
   ts_rank(to_tsvector('english',coalesce(v.title,'')||' '||coalesce(v.category,'')),q.query)::real
  from videos v,q where v.status='published' and to_tsvector('english',coalesce(v.title,'')||' '||coalesce(v.category,''))@@q.query
 ) select * from results order by rank desc,title limit greatest(1,least(p_limit,100));
$$;
