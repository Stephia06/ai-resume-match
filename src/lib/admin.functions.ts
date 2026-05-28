import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

async function assertAdmin(supabase: any, userId: string) {
  const { data } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId);
  if (!data?.some((r: any) => r.role === "admin")) {
    throw new Error("Forbidden: admin access required");
  }
}

export const listAllUsers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);

    const { data: authData, error: authErr } =
      await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    if (authErr) throw new Error(authErr.message);

    const ids = authData.users.map((u) => u.id);
    const [{ data: profiles }, { data: roles }] = await Promise.all([
      supabaseAdmin.from("profiles").select("user_id, full_name, email").in("user_id", ids),
      supabaseAdmin.from("user_roles").select("user_id, role").in("user_id", ids),
    ]);
    const pmap = new Map((profiles ?? []).map((p) => [p.user_id, p]));
    const rmap = new Map<string, string[]>();
    (roles ?? []).forEach((r) => {
      const arr = rmap.get(r.user_id) ?? [];
      arr.push(r.role);
      rmap.set(r.user_id, arr);
    });

    return authData.users.map((u) => ({
      id: u.id,
      email: u.email ?? pmap.get(u.id)?.email ?? null,
      full_name: pmap.get(u.id)?.full_name ?? null,
      roles: rmap.get(u.id) ?? [],
      created_at: u.created_at,
      last_sign_in_at: u.last_sign_in_at ?? null,
      email_confirmed_at: u.email_confirmed_at ?? null,
      banned_until: (u as any).banned_until ?? null,
      provider: u.app_metadata?.provider ?? null,
    }));
  });

export const getUserDetails = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { userId: string }) =>
    z.object({ userId: z.string().uuid() }).parse(d),
  )
  .handler(async ({ context, data }) => {
    await assertAdmin(context.supabase, context.userId);

    const { data: u, error } = await supabaseAdmin.auth.admin.getUserById(data.userId);
    if (error) throw new Error(error.message);
    const user = u.user;

    const [{ data: profile }, { data: roles }, { data: jobs }, { data: apps }] =
      await Promise.all([
        supabaseAdmin.from("profiles").select("*").eq("user_id", data.userId).maybeSingle(),
        supabaseAdmin.from("user_roles").select("role, created_at").eq("user_id", data.userId),
        supabaseAdmin.from("jobs").select("id, title, company, status, created_at").eq("hr_id", data.userId).order("created_at", { ascending: false }),
        supabaseAdmin
          .from("applications")
          .select("id, status, match_score, ats_score, created_at, job:jobs(id, title, company)")
          .eq("candidate_id", data.userId)
          .order("created_at", { ascending: false }),
      ]);

    return {
      auth: {
        id: user!.id,
        email: user!.email,
        phone: user!.phone,
        created_at: user!.created_at,
        updated_at: user!.updated_at,
        last_sign_in_at: user!.last_sign_in_at,
        email_confirmed_at: user!.email_confirmed_at,
        phone_confirmed_at: user!.phone_confirmed_at,
        banned_until: (user as any)?.banned_until ?? null,
        provider: user!.app_metadata?.provider ?? null,
        providers: user!.app_metadata?.providers ?? [],
        user_metadata: user!.user_metadata ?? {},
      },
      profile,
      roles: roles ?? [],
      jobs: jobs ?? [],
      applications: apps ?? [],
    };
  });