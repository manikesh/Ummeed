# Ummeed — Burn Survivor Support App

> "Ummeed" means **hope**. This is a React Native + Expo app (TypeScript) that
> connects burn and acid-attack survivors with doctors, NGOs, counselors and
> legal aid, with an accessibility-first UI.

- Frontend: **Expo (React Native)** + TypeScript, runs on Android via Expo Go
- Backend: **Supabase** (Postgres + Auth + Storage, no custom backend)
- Auth: **Email OTP (6-digit)** via Supabase Auth
- Architecture: app talks directly to Supabase (anon key on device, RLS protects data)

---

## 1. Supabase setup — already done ✅

The Supabase project (`vlztioqltxykcusrxsmi`) has been fully configured for you:
- Schema applied (6 tables + 2 storage buckets + RLS + triggers + 5 seed hospitals + 10 seed content items)
- `mailer_autoconfirm = true` so sign-up creates a session instantly without sending email
- Anon key is already in `.env`

### Dev-mode OTP (important)

Because the project is on the Supabase free tier, the email template cannot
be modified to embed the 6-digit code as plain text. As a temporary
stand-in, the app **accepts the hardcoded OTP `123456` for any email**. When
that code is entered, the app signs the user in (or signs them up) using a
deterministic email+password pair — so a **real Supabase session** is created
and RLS works exactly like it will in production.

To switch back to real email OTP later:
1. Add a custom SMTP provider in Supabase Auth → SMTP Settings (Resend, SendGrid, etc.).
2. Open `contexts/AuthContext.tsx` and flip `USE_OTP_BYPASS` to `false`.
3. Update the Magic Link email template (Auth → Email Templates) to include `{{ .Token }}`.

### To create an admin user

After your first sign-in (any email + code `123456`), grant yourself admin from the Supabase SQL editor:

```sql
update public.profiles
set role = 'admin', verification_status = 'approved'
where id = (select id from auth.users where email = 'your-email@example.com');
```

Sign out and sign back in — you'll land on the Admin dashboard.

---

## 2. Run the app

```bash
cd /app/ummeed
npm install            # only first time
npm start              # opens Expo dev tools; scan the QR with Expo Go on Android
```

- **Android (real device)**: install **Expo Go** from Play Store, scan the QR code.
- **Android emulator**: press `a` in the Expo terminal.

The first build takes ~30 seconds; subsequent reloads are instant.

---

## 3. MVP features

| Role | Features |
|---|---|
| **Patient** | Email-OTP sign in, personal profile, burn-incident log, medical-records (notes + file/photo upload), hospital search, NGO / counselor / legal-aid search, send connection requests, emergency screen (helplines, first-aid, schemes) |
| **Doctor** | Email-OTP sign in, awaits admin approval, profile (license / specialization / hospital), inbox of patient connection requests (accept / decline), access medical records of accepted patients |
| **NGO / Counselor / Legal aid / Volunteer** | Email-OTP sign in, awaits admin approval, organization profile, inbox of patient connection requests |
| **Admin** | User approvals (doctors, NGOs, counselors, legal aid), hospital CRUD, content CMS (first-aid, helplines, schemes, news, videos) |
| **Unregistered** | Welcome screen → Emergency / first-aid content available without sign in |

---

## 4. Project layout

```
ummeed/
├── App.tsx
├── app.json
├── tsconfig.json
├── package.json
├── .env                         # Supabase URL + anon key
├── assets/                      # icon.png, splash.png
├── theme/                       # colors, spacing, fonts (accessibility-first)
├── lib/
│   ├── supabase.ts              # @supabase/supabase-js client (AsyncStorage)
│   └── types.ts                 # TypeScript types
├── contexts/
│   ├── AuthContext.tsx          # session + profile + sendOtp / verifyOtp
│   └── NavContext.tsx           # tiny stack-based navigator
├── components/                  # Button, Input, Card, Header, Screen, Logo
├── screens/
│   ├── WelcomeScreen.tsx
│   ├── auth/                    # RoleSelect, Login, Otp, PendingApproval
│   ├── patient/                 # Home, Profile, BurnIncident, MedicalRecords, HospitalSearch, NgoSearch, Emergency
│   ├── doctor/                  # Home, ProviderProfile (shared), ProviderPatients (shared)
│   ├── ngo/                     # Home (reuses provider profile + patients)
│   └── admin/                   # Home, Approvals, Hospitals, Content
├── navigation/RootNavigator.tsx
└── supabase/schema.sql          # ONE-SHOT schema + RLS + storage + seed
```

---

## 5. iOS extensibility

The whole app is plain React Native + Expo with no Android-only modules.
To run on iOS:

```bash
npm run ios            # macOS only (needs Xcode)
# or use Expo Go on iPhone
```

For app-store builds, use **EAS**: `npx eas build -p ios` (or `-p android`).

---

## 6. Security notes

- We only ship the **anon (publishable) key** on-device — this is the recommended Supabase pattern for mobile apps.
- All tables have **Row Level Security** on. The `schema.sql` defines policies so that:
  - Patients can only read / write **their own** profile, burn-incidents and medical records.
  - Doctors / NGOs / counselors / legal-aid can only read a patient's medical data **after** the patient sent them a connection request and the request is `accepted`.
  - Admins can read / write everything.
- Storage buckets `profile_photos` and `medical_records` are **private**; only owners / connected providers / admins can read.
- **Never** ship the Supabase *service_role* key in the Expo app.

---

## 7. Things deliberately deferred (post-MVP)

These were in the original document but are not required for the first launch:
- Doctor "burn camp" publishing
- Mental-health video library
- Push notifications for connection updates
- In-app messaging between patient and provider
- Volunteer task board
- Doctor-side bulk upload of educational material

Add an issue / message and we'll layer them in.
