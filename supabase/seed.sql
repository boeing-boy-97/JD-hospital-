-- Fictional demo seed data. No clinician credentials are asserted.
insert into hospitals(slug,name,city,address,phone,emergency_phone,overview,status) values
('jd-hospital-nagpur','JD Hospital, Nagpur','Nagpur','Central Avenue, Nagpur, Maharashtra','+91 712 400 7000','+91 712 400 7001','Demo multispeciality hospital.','published'),
('jd-hospital-pune','JD Hospital, Pune','Pune','Baner Road, Pune, Maharashtra','+91 20 4000 7000','+91 20 4000 7001','Demo multispeciality hospital.','published'),
('jd-hospital-mumbai','JD Hospital, Mumbai','Mumbai','Andheri East, Mumbai, Maharashtra','+91 22 4000 7000','+91 22 4000 7001','Demo multispeciality hospital.','published'),
('jd-hospital-nashik','JD Hospital, Nashik','Nashik','College Road, Nashik, Maharashtra','+91 253 400 7000','+91 253 400 7001','Demo hospital.','published'),
('jd-hospital-aurangabad','JD Hospital, Chhatrapati Sambhajinagar','Chhatrapati Sambhajinagar','Jalna Road, Maharashtra','+91 240 400 7000','+91 240 400 7001','Demo hospital.','published'),
('jd-hospital-thane','JD Hospital, Thane','Thane','Ghodbunder Road, Thane','+91 22 4100 7000','+91 22 4100 7001','Demo hospital.','published'),
('jd-hospital-kolhapur','JD Hospital, Kolhapur','Kolhapur','Tarabai Park, Kolhapur','+91 231 400 7000','+91 231 400 7001','Demo hospital.','published'),
('jd-hospital-goa','JD Hospital, Goa','Panaji','Dona Paula, Goa','+91 832 400 7000','+91 832 400 7001','Demo hospital.','published'),
('jd-hospital-indore','JD Hospital, Indore','Indore','Vijay Nagar, Indore','+91 731 400 7000','+91 731 400 7001','Demo hospital.','published'),
('jd-hospital-hyderabad','JD Hospital, Hyderabad','Hyderabad','HITEC City, Hyderabad','+91 40 4000 7000','+91 40 4000 7001','Demo hospital.','published');
insert into specialties(slug,name,overview,status) values
('cardiac-sciences','Cardiac Sciences','Integrated heart care.','published'),('neurosciences','Neurosciences','Brain, spine and nerve care.','published'),('orthopaedics','Orthopaedics','Bone, joint and mobility care.','published'),('oncology','Oncology','Multidisciplinary cancer care.','published'),('gastroenterology','Gastroenterology','Digestive and liver care.','published'),('nephrology','Nephrology','Kidney care.','published'),('urology','Urology','Urinary health care.','published'),('pulmonology','Pulmonology','Respiratory medicine.','published'),('ent','ENT','Ear, nose and throat care.','published'),('internal-medicine','Internal Medicine','Adult medical care.','published'),('endocrinology','Endocrinology','Hormone and metabolic care.','published'),('dermatology','Dermatology','Skin health.','published'),('ophthalmology','Ophthalmology','Eye care.','published'),('paediatrics','Paediatrics','Child health.','published'),('obstetrics-gynaecology','Obstetrics & Gynaecology','Women’s health.','published'),('rheumatology','Rheumatology','Autoimmune and joint care.','published'),('haematology','Haematology','Blood disorders.','published'),('vascular-surgery','Vascular Surgery','Blood vessel care.','published'),('plastic-surgery','Plastic Surgery','Reconstructive care.','published'),('anaesthesiology','Anaesthesiology','Perioperative medicine.','published'),('critical-care','Critical Care','Intensive care.','published'),('emergency-medicine','Emergency Medicine','Urgent care.','published'),('radiology','Radiology','Imaging.','published'),('pathology','Pathology','Laboratory medicine.','published'),('physiotherapy','Physiotherapy','Rehabilitation.','published');
insert into doctors(slug,name,designation,qualifications,experience_years,gender,languages,registration_verified,status)
select 'demo-doctor-'||n,'Demo Doctor '||n,'Demo Consultant, '||(array['Cardiac Sciences','Neurosciences','Orthopaedics','Oncology','Gastroenterology'])[1+((n-1)%5)],array['Demo credentials — verification required'],5+(n%20),case when n%2=0 then 'Female' else 'Male' end,array['English','Hindi'],false,'published' from generate_series(1,40)n;
insert into health_packages(slug,hospital_id,name,description,category,price,duration_minutes,status)
select 'demo-package-'||n,(select id from hospitals order by name limit 1 offset ((n-1)%10)),'Demo Health Package '||n,'Representative preventive package.','Preventive',1500+(n*250),180+(n%4)*30,'published' from generate_series(1,20)n;
insert into article_categories(slug,name) values ('heart-health','Heart Health'),('brain-health','Brain Health'),('preventive-care','Preventive Care');
insert into articles(slug,title,excerpt,content,author,status,published_at)
select 'demo-article-'||n,'Demo health article '||n,'Educational demo content.','This is educational placeholder content and not medical advice.','JD Editorial Team','published',now()-(n||' days')::interval from generate_series(1,30)n;
insert into videos(slug,title,category,youtube_url,status,published_at) select 'demo-video-'||n,'Demo doctor video '||n,'General Health','https://www.youtube.com/embed/dQw4w9WgXcQ','published',now() from generate_series(1,10)n;
insert into faqs(question,answer,category,status) select 'Demo frequently asked question '||n||'?','Contact the hospital for information specific to your care.','General','published' from generate_series(1,15)n;
insert into clinics(city,location,address,contact,weekday,start_time,end_time,status) select (array['Nagpur','Pune','Mumbai'])[1+((n-1)%3)],'Demo Specialty Clinic '||n,'Demo address','+91 712 400 7000',n%6,'09:00','13:00','published' from generate_series(1,10)n;

-- Phase 2 demo services and jobs
insert into homecare_services(slug,name,description,eligibility,status) values
('doctor-visit','Doctor visit','Scheduled clinician visit at home.','Subject to clinical triage and location.','published'),
('nursing','Nursing care','Planned nursing support at home.','Requires care-team assessment.','published'),
('physiotherapy','Physiotherapy','Goal-based mobility and recovery support.','Subject to physiotherapist assessment.','published'),
('pathology','Pathology collection','Home sample collection where available.','Location and test restrictions apply.','published'),
('equipment','Medical equipment','Equipment coordination and orientation.','Prescription may be required.','published') on conflict(slug) do nothing;
insert into jobs(slug,title,department,location,employment_type,description,status,published_at) values
('staff-nurse-critical-care','Staff Nurse — Critical Care','Nursing','Nagpur','Full-time','Join a multidisciplinary critical care team focused on safe and compassionate nursing practice.','published',now()),
('patient-experience-executive','Patient Experience Executive','Patient Services','Pune','Full-time','Help patients and families navigate appointments, admissions and follow-up with clarity and empathy.','published',now()) on conflict(slug) do nothing;

-- Create schedules for published demo doctors at their linked hospitals after assigning relationships.
insert into doctor_hospitals(doctor_id,hospital_id)
select d.id,h.id from doctors d cross join lateral (select id from hospitals order by name limit 1 offset ((abs(hashtext(d.slug)))%10)) h on conflict do nothing;
insert into doctor_specialties(doctor_id,specialty_id)
select d.id,s.id from doctors d cross join lateral (select id from specialties order by name limit 1 offset ((abs(hashtext(d.slug)))%25)) s on conflict do nothing;
insert into doctor_schedules(doctor_id,hospital_id,weekday,start_time,end_time,consultation_type,slot_minutes)
select dh.doctor_id,dh.hospital_id,day,'09:00','17:00','In-person',30 from doctor_hospitals dh cross join generate_series(1,6) day
where not exists(select 1 from doctor_schedules x where x.doctor_id=dh.doctor_id and x.hospital_id=dh.hospital_id and x.weekday=day);
