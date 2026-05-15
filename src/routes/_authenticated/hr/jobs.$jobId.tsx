import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getJob, listApplicationsForJob, updateJobStatus } from "@/lib/app.functions";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScoreRing } from "@/components/app/ScoreRing";
import { Briefcase, Building2, Loader2, Users } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/hr/jobs/$jobId")({
  component: HrJobDetail,
});

function HrJobDetail() {
  const { jobId } = Route.useParams();
  const fetchJob = useServerFn(getJob);
  const fetchApps = useServerFn(listApplicationsForJob);
  const setStatus = useServerFn(updateJobStatus);
  const [job, setJob] = useState<any>(null);
  const [apps, setApps] = useState<any[] | null>(null);

  const load = useCallback(() => {
    fetchJob({ data: { jobId } }).then((d) => setJob(d.job)).catch((e) => toast.error(e.message));
    fetchApps({ data: { jobId } }).then(setApps).catch(() => setApps([]));
  }, [fetchJob, fetchApps, jobId]);

  useEffect(() => { load(); }, [load]);

  if (!job) return <Loader2 className="h-6 w-6 animate-spin text-primary" />;

  const toggleStatus = async () => {
    const next = job.status === "open" ? "closed" : "open";
    await setStatus({ data: { jobId, status: next } });
    toast.success(`Job ${next}`);
    load();
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <Card className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="h-12 w-12 rounded-lg bg-primary/15 flex items-center justify-center">
              <Briefcase className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{job.title}</h1>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <Building2 className="h-3 w-3" /> {job.company}
              </p>
              <div className="flex flex-wrap gap-1 mt-3">
                {job.required_skills.map((s: string) => <Badge key={s} variant="outline">{s}</Badge>)}
              </div>
            </div>
          </div>
          <Button variant="outline" onClick={toggleStatus}>
            {job.status === "open" ? "Close job" : "Reopen job"}
          </Button>
        </div>
      </Card>

      <div>
        <h2 className="text-xl font-bold flex items-center gap-2 mb-4">
          <Users className="h-5 w-5 text-primary" /> Applicants {apps && `(${apps.length})`}
        </h2>
        {apps === null ? (
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        ) : apps.length === 0 ? (
          <Card className="p-8 text-center text-muted-foreground">No applications yet.</Card>
        ) : (
          <div className="space-y-2">
            {apps.map((a) => (
              <Link key={a.id} to="/hr/applications/$id" params={{ id: a.id }}>
                <Card className="p-4 flex items-center justify-between gap-4 hover:border-primary/50">
                  <div className="flex items-center gap-4">
                    <ScoreRing score={a.match_score} label="Match" size={64} />
                    <div>
                      <p className="font-semibold">{a.candidate?.full_name || "Candidate"}</p>
                      <p className="text-xs text-muted-foreground">{a.candidate?.email}</p>
                      <p className="text-xs text-muted-foreground italic mt-1 line-clamp-1">{a.verdict}</p>
                    </div>
                  </div>
                  <StatusBadge status={a.status} />
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    accepted: "bg-primary/15 text-primary border-primary/40",
    rejected: "bg-destructive/15 text-destructive border-destructive/40",
    pending: "bg-muted text-muted-foreground border-border",
  };
  return <Badge variant="outline" className={map[status] ?? map.pending}>{status}</Badge>;
}