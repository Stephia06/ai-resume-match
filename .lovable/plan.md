## Smart AI Resume — Auth + Dual Dashboards (Candidate & HR)

Add full authentication with two roles (candidate, HR) and dedicated dashboards for each. HR can post jobs; candidates apply by uploading a resume; the AI scores each application against the JD; HR reviews ranked applications and accepts/rejects.

### Database (new migration)

- `profiles` — `user_id` (uniq, FK auth.users), `full_name`, `email`
- `app_role` enum: `'candidate' | 'hr'`
- `user_roles` — `user_id`, `role` (separate table; `has_role()` SECURITY DEFINER fn — required for safe RLS)
- `jobs` — `hr_id`, `title`, `company`, `description`, `required_skills text[]`, `status`, timestamps
- `applications` — `job_id`, `candidate_id`, `resume_text`, `match_score int`, `ats_score int`, `matched_keywords text[]`, `missing_keywords text[]`, `summary text`, `report jsonb` (full AI report), `status` enum `'pending'|'accepted'|'rejected'`, timestamps
- Storage bucket `resumes` (private) — path `{candidate_id}/{application_id}.{ext}`
- RLS:
  - profiles: self read/write; HR can read candidate profiles for their applications
  - jobs: HR full control of own; candidates read all `open` jobs
  - applications: candidate sees own; HR sees applications to own jobs and can update `status`
- Trigger: auto-create profile + default `candidate` role on signup. Role selection at signup writes the chosen role.

### Auth

- `/login` and `/signup` — single shared pages with a role toggle (Candidate / HR). Email+password + Google OAuth (via Lovable broker).
- `_authenticated` layout route guarding all dashboards; root listens to `onAuthStateChange` to invalidate router/queries.
- Auth context exposes `user`, `role`, `signOut`.

### Routes

```
/                              landing (existing)
/login, /signup                shared, role toggle
/_authenticated/
  dashboard                    redirects by role
  candidate/
    index                      list of open jobs + my applications
    jobs/$jobId                JD detail + "Apply" (upload resume → AI scores → creates application)
    applications/$id           candidate's own AI report (existing analyzer UI repurposed)
  hr/
    index                      HR overview: my jobs + counts
    jobs/new                   create job (title, company, JD, required skills)
    jobs/$jobId                job detail + ranked applications table (sorted by match_score)
    applications/$id           AI report + Accept / Reject buttons
```

### Server functions (`src/lib/*.functions.ts`)

- `signUpWithRole({ email, password, fullName, role })` — calls Supabase signUp, then inserts role.
- `createJob`, `listOpenJobs`, `getJob`, `listMyJobs` (HR).
- `submitApplication({ jobId, resumeText, fileName })` — runs the existing Gemini ATS analysis against the job's JD + required skills, persists report + score, returns id.
- `listApplicationsForJob(jobId)` — HR only, ranked by score.
- `listMyApplications()` — candidate.
- `getApplication(id)` — owner or HR of the job.
- `updateApplicationStatus(id, status)` — HR only.

All use `requireSupabaseAuth`; HR-only functions also check `has_role(userId, 'hr')`. Resume parsing stays client-side (existing `parseResume.ts`); extracted text is sent to the server function.

### UI

- Role-aware nav in `_authenticated` layout (sidebar with link set per role).
- HR job-detail page: table of applicants with score ring, status badge, Accept/Reject inline + drill-in.
- Candidate job-detail page: JD + upload widget + recent score if already applied.
- Reuse `ScoreRing` component and existing report tabs.

### Wiring

- Append `attachSupabaseAuth` to `functionMiddleware` in `src/start.ts` (create file if missing per template).
- Keep landing page `/` public; move existing analyzer demo behind `/_authenticated/candidate/analyze` as a free-form tool (optional, kept for parity).

### Out of scope

- Email notifications, interview scheduling, candidate messaging — not in this pass.
