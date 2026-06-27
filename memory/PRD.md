# Ummeed PRD

## Original problem statement
Build an Android app (React + Expo, extensible to iOS) called **Ummeed** for
burn patients (especially acid-attack survivors). Backend = **Supabase**
(provided project ref `vlztioqltxykcusrxsmi` + anon key). Auth = email OTP
(6 digits, confirmed with user). UI must be clean and accessible (low-vision
friendly). Code in **TSX**.

## User personas
- **Patient / survivor** – primary user. Logs incidents, uploads medical
  records, searches hospitals and support providers, accesses helplines.
- **Doctor** – treats patients, must be verified by admin.
- **NGO / Counselor / Legal aid / Volunteer** – provides support, must be
  verified by admin.
- **Admin** – approves providers, manages hospitals and content.
- **Unregistered visitor** – can browse emergency / first-aid info.

## Architecture
- Expo (React Native) TypeScript app at `/app/ummeed/`.
- Single backend: **Supabase** (Postgres + Auth + Storage), no custom API.
- Auth: email OTP (6-digit) via Supabase Auth. Profile auto-created on
  signup via a Postgres trigger that reads `raw_user_meta_data.role`.
- Storage: two private buckets – `profile_photos` and `medical_records`.
- All access protected by RLS policies that key off `auth.uid()`,
  `connections.status = 'accepted'`, or `is_admin()`.

## What's been implemented (Jan 2026)
- Full Expo TS scaffold (`App.tsx`, theme tokens, Logo SVG, Button, Input,
  Card, Header, Screen).
- Tiny stack-based navigator (`NavContext`) – no native nav dep required.
- `AuthContext` – session + profile + sendOtp / verifyOtp.
- 17 screens: Welcome, RoleSelect, Login, Otp, PendingApproval,
  PatientHome, PatientProfile, BurnIncident, MedicalRecords (with photo +
  document upload to Supabase Storage), HospitalSearch, NgoSearch
  (NGO / counselor / legal-aid / doctor tabs + send connection),
  Emergency (helplines, first-aid, schemes, news, videos),
  DoctorHome, ProviderProfile (shared by doctor/ngo/counselor/legal),
  ProviderPatients (accept / decline), NgoHome, AdminHome,
  AdminApprovals, AdminHospitals (CRUD), AdminContent (CRUD).
- One-shot `supabase/schema.sql` (~400 lines) – enums, profiles,
  hospitals, burn_incidents, medical_records, connections, content_items,
  triggers, RLS policies for tables and storage, plus seed data
  (5 hospitals + 10 content items).
- README with step-by-step Supabase dashboard instructions
  (paste SQL, switch OTP email template to `{{ .Token }}`, promote an
  admin user).

## Core requirements (MVP, confirmed by user)
- Patient register/login, profile, burn-incident, medical-records upload.
- Search hospital, search NGO, emergency resources.
- Doctor + NGO registration, admin verification, profile, connect with
  patients.
- Admin: user approvals, hospital management, content management.

## Prioritized backlog (P1/P2, post-MVP)
- P1: in-app messaging between connected patient & provider.
- P1: push notifications (Expo notifications) for connection updates.
- P1: doctor "burn camp" announcements.
- P2: counselor video library + curated YouTube playlists.
- P2: volunteer task board.
- P2: location-based hospital sort (geohash or PostGIS).
- P2: iOS EAS build + App Store submission.

## Open items
- User must run `supabase/schema.sql` in the Supabase SQL Editor (cannot
  be done from the device with anon key).
- User must edit Auth email template to use `{{ .Token }}` so OTP emails
  ship a 6-digit code rather than a magic-link.
- App not yet end-to-end tested on a real device (user said they will run
  `npm start` + Expo Go locally).
