# Ummeed — Burn Survivor Support App

> "Ummeed" means **hope**. This is a React Native + Expo app (TypeScript) that
> connects burn and acid-attack survivors with doctors, NGOs, counselors and
> legal aid, with an accessibility-first UI.

- Frontend: **Expo (React Native)** + TypeScript, runs on Android via Expo Go
- Backend: **Supabase** (Postgres + Auth + Storage, no custom backend)
- Auth: **Email OTP (6-digit)** via Supabase Auth
- Architecture: app talks directly to Supabase (anon key on device, RLS protects data)

---

## 1. One-time Supabase setup (~5 minutes)

The Supabase project is already configured in `.env`:

```
EXPO_PUBLIC_SUPABASE_URL=https://vlztioqltxykcusrxsmi.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiI...
```

You must do **two things** in the Supabase dashboard before the app works:

### 1a. Run the schema

1. Open https://supabase.com/dashboard/project/vlztioqltxykcusrxsmi/sql/new
2. Paste the entire contents of **`supabase/schema.sql`** and click **Run**.
3. You should see *Success. No rows returned* (it also seeds 5 hospitals and 10 content items).

### 1b. Switch the OTP email template from magic-link to 6-digit code

Supabase's default email template sends a *magic-link*. We want the **6-digit token**.

1. Open https://supabase.com/dashboard/project/vlztioqltxykcusrxsmi/auth/templates
2. Select **"Magic Link"** template.
3. Replace the body with the snippet below (the important line is `{{ .Token }}`) and **Save**:

```html
<h2>Your Ummeed sign-in code</h2>
<p>Hello,</p>
<p>Your 6-digit Ummeed verification code is:</p>
<h1 style="letter-spacing:6px">{{ .Token }}</h1>
<p>This code will expire in 60 minutes. If you did not request it, ignore this email.</p>
```

> If you want SMS OTP later, configure Twilio in Supabase Auth → Providers → Phone.

### 1c. Create an admin user (optional but recommended)

After you sign in once as `admin@yourdomain.com` (via the app), promote that user:

```sql
update public.profiles
set role = 'admin', verification_status = 'approved'
where id = (select id from auth.users where email = 'admin@yourdomain.com');
```

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
