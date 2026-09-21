# JD Hospital — Phase 2 healthcare platform

An original, production-oriented Next.js 16 + Supabase hospital platform. All sample hospitals, clinician profiles, jobs, stories and metrics are explicitly demonstration data.

## Stack
- Next.js 16 App Router, React 19, TypeScript
- Supabase PostgreSQL, Auth, Storage and Row Level Security
- Zod-validated server APIs
- Leaflet + OpenStreetMap
- Lucide icons; responsive WCAG-oriented design system

## Local setup
1. `npm install`
2. Copy `.env.example` to `.env.local`.
3. Create a Supabase project.
4. In Supabase SQL Editor run, in order:
   - `supabase/schema.sql`
   - `supabase/phase2_hardening.sql`
   - `supabase/phase3_content_media.sql`
   - `supabase/seed.sql`
5. Add the project URL, anon key and server-only service role key to `.env.local`.
6. `npm run dev`

The public UI has an explicitly labelled demo fallback so the project can be reviewed without credentials. When Supabase is configured, repositories read published database records and validated server endpoints persist appointments, enquiries, home-care requests, and job applications.

## Activate an admin
1. Create a user in Supabase Authentication.
2. Insert their UUID into `public.admins`:
   ```sql
   insert into public.admins(user_id, role) values ('AUTH_USER_UUID', 'admin');
   ```
3. Sign in at `/admin/login`.

Admin appointment reads and status updates use the signed-in Supabase session and RLS. The service-role key is never included in browser code.

## Appointment integrity
`phase2_hardening.sql` adds:
- Dynamic schedule-based slot generation
- Exclusion of already-booked slots
- A partial unique index preventing double booking
- Idempotency keys preventing duplicate submission
- Transactional booking RPC
- Sequential appointment references
- Private appointment access tokens
- Admin activity logging

## Storage and uploads
Resumes accept PDF or DOCX files up to 5 MB. Production deployments should additionally configure Supabase bucket-level MIME and object-size restrictions in the dashboard.

## Quality checks
- `npm run lint`
- `npm run typecheck`
- `npm run build`
- Start the app, then run `npm run smoke`
- `npm run check` runs lint, typecheck and the production build.

Licensed image and public-reference provenance is recorded in `data/source-manifest.json` and seeded into `content_sources` / `media_assets` by the Phase 3 migration.

## JD Hospital AI voice calling
The public site includes an in-page voice-call overlay powered by the official `@elevenlabs/react` SDK. The SDK is lazy-loaded only after the visitor selects **Talk to AI**; no hosted ElevenLabs page or iframe is used.

- Public-agent mode works with `ELEVENLABS_AGENT_ID` and does not require an API key.
- For production signed sessions, set the server-only `ELEVENLABS_API_KEY`, enable agent authentication in ElevenLabs, and keep `ELEVENLABS_REQUIRE_SIGNED_URL=true`.
- `ELEVENLABS_BRANCH_ID` is sent only by the server while requesting a short-lived signed URL.
- Never prefix the API key with `NEXT_PUBLIC_`; the key must not enter the browser bundle.
- The session endpoint is same-origin protected, rate limited, non-cacheable, and returns only a public agent identifier or short-lived signed URL.

## Vercel deployment
1. Import the GitHub repository into Vercel.
2. Add all variables from `.env.example` to the Vercel project.
3. Set `NEXT_PUBLIC_SITE_URL` to the final HTTPS domain.
4. Run all three schema/migration files and the seed in Supabase before the first production request.
5. Deploy using the default Next.js preset; no custom build command is required.

## Production checklist
- Replace demo records only after clinical credential verification.
- Review legal pages with qualified counsel.
- Configure SMTP for password resets and appointment notifications.
- Restrict Vercel environment variables by environment.
- Add a CAPTCHA/WAF rule to high-volume public forms.
- Run RLS tests against anon, authenticated patient, editor and admin roles.
- Set `NEXT_PUBLIC_SITE_URL` to the canonical production URL.
- Run `npm run build`, deploy to Vercel, and perform browser/Lighthouse testing against the deployed origin.

## Security notes
Private tables expose no anonymous read policy. Public submissions pass through Zod-validated server routes. Admin APIs validate the Supabase user and `admins` membership. Appointment slots are revalidated in PostgreSQL during booking; client availability is never trusted.
