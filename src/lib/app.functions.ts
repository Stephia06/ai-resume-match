import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { runAtsAnalysis } from "@/lib/ai-analyze.server";
import type { Json } from "@/integrations/supabase/types";

// ----- Profile / role -----
export const getMe = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const [{ data: profile }, { data: roles }] = await Promise.all([
      supabase.from("profiles").select("*").eq("user_id", userId).maybeSingle(),
      supabase.from("user_roles").select("role").eq("user_id", userId),
    ]);
    return {
      userId,
      profile,
      role: (roles?.[0]?.role ?? "candidate") as "candidate" | "hr",
    };
  });

// ----- Jobs -----
export const listOpenJobs = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("jobs")
      .select("*")
      .eq("status", "open")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data;
  });

export const listMyJobs = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: jobs, error } = await supabase
      .from("jobs")
      .select("*")
      .eq("hr_id", userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    const ids = (jobs ?? []).map((j) => j.id);
    let counts: Record<string, number> = {};
    if (ids.length) {
      const { data: apps } = await supabase
        .from("applications")
        .select("job_id")
        .in("job_id", ids);
      counts = (apps ?? []).reduce<Record<string, number>>((m, a) => {
        m[a.job_id] = (m[a.job_id] ?? 0) + 1;
        return m;
      }, {});
    }
    return (jobs ?? []).map((j) => ({ ...j, application_count: counts[j.id] ?? 0 }));
  });

export const getJob = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { jobId: string }) => z.object({ jobId: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    const { data: job, error } = await context.supabase
      .from("jobs")
      .select("*")
      .eq("id", data.jobId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!job) throw new Error("Job not found");
    // also return whether current user already applied
    const { data: existing } = await context.supabase
      .from("applications")
      .select("id, match_score, status")
      .eq("job_id", data.jobId)
      .eq("candidate_id", context.userId)
      .maybeSingle();
    return { job, myApplication: existing };
  });

const CreateJobSchema = z.object({
  title: z.string().trim().min(2).max(120),
  company: z.string().trim().min(1).max(120),
  description: z.string().trim().min(20).max(20000),
  required_skills: z.array(z.string().trim().min(1).max(60)).max(40).default([]),
});

export const createJob = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => CreateJobSchema.parse(d))
  .handler(async ({ context, data }) => {
    const { data: roles } = await context.supabase
      .from("user_roles").select("role").eq("user_id", context.userId);
    if (!roles?.some((r) => r.role === "hr")) throw new Error("Only HR users can post jobs");
    const { data: job, error } = await context.supabase
      .from("jobs")
      .insert({ ...data, hr_id: context.userId })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return job;
  });

export const updateJobStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { jobId: string; status: "open" | "closed" }) =>
    z.object({ jobId: z.string().uuid(), status: z.enum(["open", "closed"]) }).parse(d))
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase
      .from("jobs")
      .update({ status: data.status })
      .eq("id", data.jobId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ----- Applications -----
const SubmitSchema = z.object({
  jobId: z.string().uuid(),
  resumeText: z.string().min(50).max(50000),
  fileName: z.string().max(200).optional(),
});

export const submitApplication = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => SubmitSchema.parse(d))
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;

    const { data: job, error: jErr } = await supabase
      .from("jobs").select("*").eq("id", data.jobId).maybeSingle();
    if (jErr) throw new Error(jErr.message);
    if (!job) throw new Error("Job not found");
    if (job.status !== "open") throw new Error("This job is closed");

    const jdText =
      `${job.title} at ${job.company}\n\n${job.description}\n\nRequired skills: ${job.required_skills.join(", ")}`;

    const report = await runAtsAnalysis(data.resumeText, jdText);

    const payload = {
      job_id: data.jobId,
      candidate_id: userId,
      resume_text: data.resumeText,
      resume_file_name: data.fileName ?? null,
      match_score: Math.round(report.matchScore),
      ats_score: Math.round(report.atsCompatibility),
      matched_keywords: report.matchedKeywords ?? [],
      missing_keywords: report.missingKeywords ?? [],
      verdict: report.verdict,
      report: report as unknown as Json,
      status: "pending" as const,
    };

    const { data: app, error } = await supabase
      .from("applications")
      .upsert([payload], { onConflict: "job_id,candidate_id" })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { id: app.id, matchScore: payload.match_score };
  });

export const listMyApplications = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("applications")
      .select("id, status, match_score, ats_score, created_at, verdict, job:jobs(id, title, company)")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data;
  });

export const listApplicationsForJob = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { jobId: string }) => z.object({ jobId: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const { data: job } = await supabase
      .from("jobs").select("hr_id").eq("id", data.jobId).maybeSingle();
    if (!job || job.hr_id !== userId) throw new Error("Not authorized");
    const { data: apps, error } = await supabase
      .from("applications")
      .select("id, status, match_score, ats_score, verdict, created_at, candidate_id, resume_file_name")
      .eq("job_id", data.jobId)
      .order("match_score", { ascending: false });
    if (error) throw new Error(error.message);
    const ids = Array.from(new Set((apps ?? []).map((a) => a.candidate_id)));
    const profiles = ids.length
      ? (await supabase.from("profiles").select("user_id, full_name, email").in("user_id", ids)).data ?? []
      : [];
    const pmap = new Map(profiles.map((p) => [p.user_id, p]));
    return (apps ?? []).map((a) => ({ ...a, candidate: pmap.get(a.candidate_id) ?? null }));
  });

export const getApplication = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    const { data: app, error } = await context.supabase
      .from("applications")
      .select("*, job:jobs(*)")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!app) throw new Error("Application not found");
    let candidate: { full_name: string | null; email: string | null } | null = null;
    // HR viewing — fetch candidate profile
    if (app.candidate_id !== context.userId) {
      const { data: p } = await context.supabase
        .from("profiles").select("full_name, email").eq("user_id", app.candidate_id).maybeSingle();
      candidate = p ?? null;
    }
    return { application: app, candidate };
  });

export const updateApplicationStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string; status: "accepted" | "rejected" | "pending" }) =>
    z.object({
      id: z.string().uuid(),
      status: z.enum(["accepted", "rejected", "pending"]),
    }).parse(d))
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase
      .from("applications")
      .update({ status: data.status })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });