const base=process.env.SMOKE_BASE_URL||'http://localhost:3000';
const routes=['/','/doctors','/doctors/ananya-rao','/hospitals','/hospitals/jd-hospital-nagpur','/specialties','/specialties/cardiac-sciences','/health-packages','/health-packages/essential-health','/book-appointment','/emergency','/home-healthcare','/health-library','/health-library/understanding-preventive-health-checks','/contact','/careers','/appointment-status','/videos','/patient-stories','/image-credits','/admin','/admin/login','/admin/content','/sitemap.xml','/robots.txt'];
let failures=0;
for(const path of routes){try{const r=await fetch(base+path,{redirect:'follow'});if(!r.ok)throw new Error(`HTTP ${r.status}`);const body=await r.text();if(!body.length)throw new Error('empty response');console.log(`✓ ${r.status} ${path}`)}catch(e){failures++;console.error(`✗ ${path}: ${e.message}`)}}
const availability=await fetch(`${base}/api/availability?doctor=demo-doctor-1&hospital=demo-hospital-1&date=2027-01-20`);if(!availability.ok){failures++;console.error('✗ availability API')}else console.log('✓ availability API');
const invalid=await fetch(`${base}/api/appointments`,{method:'POST',headers:{'content-type':'application/json'},body:'{}'});if(invalid.status!==400){failures++;console.error(`✗ appointment validation expected 400, received ${invalid.status}`)}else console.log('✓ appointment server validation');
if(process.env.SMOKE_MUTATIONS==='true')console.warn('Mutation smoke tests should be run with dedicated test records in a non-production Supabase project.');
if(failures){console.error(`\n${failures} smoke test(s) failed.`);process.exit(1)}
console.log(`\nAll ${routes.length+2} smoke checks passed.`);
