import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getUserDetails } from "@/lib/admin.functions";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, ArrowLeft, Mail, Phone, Calendar, Shield, Briefcase, FileText } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/users/$userId")({
  component: UserDetail,
});

function UserDetail() {
  const { userId } = Route.useParams();
  const fetchDetails = useServerFn(getUserDetails);
  const [d, setD] = useState<any | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    fetchDetails({ data: { userId } })
      .then(setD)
      .catch((e) => setErr(e.message ?? "Failed to load user"));
  }, [fetchDetails, userId]);

  const fmt = (x: string | null | undefined) =>
    x ? new Date(x).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" }) : "—";

  if (err) return <Card className="p-6 text-destructive">{err}</Card>;
  if (!d) return <Loader2 className="h-6 w-6 animate-spin text-primary" />;

  const a = d.auth;
  const banned = a.banned_until && new Date(a.banned_until) > new Date();

  const Row = ({ label, value }: { label: string; value: React.ReactNode }) => (
    <div className="flex justify-between gap-4 py-2 border-b border-border/40 last:border-0">
      <span className="text-xs text-muted-foreground uppercase tracking-wide">{label}</span>
      <span className="text-sm text-right break-all">{value ?? "—"}</span>
    </div>
  );

  return (
    <div className="space-y-6">
      <Link to="/admin" className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
        <ArrowLeft className="h-4 w-4" /> Back to users
      </Link>

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{d.profile?.full_name || a.email}</h1>
          <p className="text-sm text-muted-foreground">{a.email}</p>
        </div>
        <div className="flex gap-2">
          {d.roles.map((r: any) => (
            <Badge key={r.role} variant="outline" className="uppercase">{r.role}</Badge>
          ))}
          {banned ? (
            <Badge variant="destructive">Banned</Badge>
          ) : a.email_confirmed_at ? (
            <Badge className="bg-primary/15 text-primary border-primary/30">Active</Badge>
          ) : (
            <Badge variant="outline">Unconfirmed</Badge>
          )}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Card className="p-5">
          <h3 className="font-semibold mb-3 flex items-center gap-2"><Shield className="h-4 w-4 text-primary" /> Account</h3>
          <Row label="User ID" value={<code className="text-xs">{a.id}</code>} />
          <Row label="Email" value={<span className="inline-flex items-center gap-1"><Mail className="h-3 w-3" />{a.email}</span>} />
          <Row label="Phone" value={a.phone ? <span className="inline-flex items-center gap-1"><Phone className="h-3 w-3" />{a.phone}</span> : "—"} />
          <Row label="Email confirmed" value={fmt(a.email_confirmed_at)} />
          <Row label="Phone confirmed" value={fmt(a.phone_confirmed_at)} />
          <Row label="Provider" value={a.providers?.length ? a.providers.join(", ") : a.provider ?? "email"} />
          <Row label="Password" value={<span className="text-muted-foreground italic">Hashed — not viewable</span>} />
        </Card>

        <Card className="p-5">
          <h3 className="font-semibold mb-3 flex items-center gap-2"><Calendar className="h-4 w-4 text-primary" /> Activity</h3>
          <Row label="Created" value={fmt(a.created_at)} />
          <Row label="Updated" value={fmt(a.updated_at)} />
          <Row label="Last sign-in" value={fmt(a.last_sign_in_at)} />
          <Row label="Banned until" value={fmt(a.banned_until)} />
          {d.roles.map((r: any) => (
            <Row key={r.role} label={`Role assigned (${r.role})`} value={fmt(r.created_at)} />
          ))}
        </Card>
      </div>

      {d.jobs.length > 0 && (
        <Card className="p-5">
          <h3 className="font-semibold mb-3 flex items-center gap-2"><Briefcase className="h-4 w-4 text-primary" /> Posted jobs ({d.jobs.length})</h3>
          <div className="space-y-2">
            {d.jobs.map((j: any) => (
              <div key={j.id} className="flex items-center justify-between text-sm border-b border-border/40 pb-2 last:border-0">
                <div>
                  <p className="font-medium">{j.title}</p>
                  <p className="text-xs text-muted-foreground">{j.company} · {fmt(j.created_at)}</p>
                </div>
                <Badge variant="outline">{j.status}</Badge>
              </div>
            ))}
          </div>
        </Card>
      )}

      {d.applications.length > 0 && (
        <Card className="p-5">
          <h3 className="font-semibold mb-3 flex items-center gap-2"><FileText className="h-4 w-4 text-primary" /> Applications ({d.applications.length})</h3>
          <div className="space-y-2">
            {d.applications.map((ap: any) => (
              <div key={ap.id} className="flex items-center justify-between text-sm border-b border-border/40 pb-2 last:border-0">
                <div>
                  <p className="font-medium">{ap.job?.title ?? "—"}</p>
                  <p className="text-xs text-muted-foreground">{ap.job?.company} · {fmt(ap.created_at)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Match {ap.match_score}%</span>
                  <Badge variant="outline">{ap.status}</Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {d.profile && (
        <Card className="p-5">
          <h3 className="font-semibold mb-3">Profile metadata</h3>
          <pre className="text-xs bg-muted/40 p-3 rounded overflow-auto">{JSON.stringify(d.profile, null, 2)}</pre>
          {Object.keys(a.user_metadata ?? {}).length > 0 && (
            <>
              <h4 className="text-sm font-medium mt-4 mb-2">Auth metadata</h4>
              <pre className="text-xs bg-muted/40 p-3 rounded overflow-auto">{JSON.stringify(a.user_metadata, null, 2)}</pre>
            </>
          )}
        </Card>
      )}
    </div>
  );
}