import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { listOpenJobs, listMyApplications } from "@/lib/app.functions";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Briefcase, Building2, FileText, Sparkles, Loader2 } from "lucide-react";
import { ScoreRing } from "@/components/app/ScoreRing";

export const Route = createFileRoute("/_authenticated/candidate/")({
  component: CandidateHome,
});

function CandidateHome() {
  const fetchJobs = useServerFn(listOpenJobs);
  const fetchApps = useServerFn(listMyApplications);
  const [jobs, setJobs] = useState<any[] | null>(null);
  const [apps, setApps] = useState<any[] | null>(null);

  useEffect(() => {
    fetchJobs().then(setJobs).catch(() => setJobs([]));
    fetchApps().then(setApps).catch(() => setApps([]));
  }, [fetchJobs, fetchApps]);

  return (
    <div className="space-y-10">
      <section>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-primary" /> Open Jobs
            </h1>
            <p className="text-sm text-muted-foreground">Apply with one click — AI scores your match instantly.</p>
          </div>
        </div>
        {jobs === null ? (
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        ) : jobs.length === 0 ? (
          <Card className="p-8 text-center text-muted-foreground">No open jobs yet. Check back soon.</Card>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {jobs.map((j) => (
              <Link
                key={j.id}
                to="/candidate/jobs/$jobId"
                params={{ jobId: j.id }}
                className="block"
              >
                <Card className="p-5 hover:border-primary/50 transition-colors h-full">
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
                      <Briefcase className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold truncate">{j.title}</h3>
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        <Building2 className="h-3 w-3" /> {j.company}
                      </p>
                      <p className="text-sm text-muted-foreground line-clamp-2 mt-2">{j.description}</p>
                      <div className="flex flex-wrap gap-1 mt-3">
                        {j.required_skills.slice(0, 5).map((s: string) => (
                          <Badge key={s} variant="outline" className="text-xs">{s}</Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" /> My Recent Applications
        </h2>
        {apps === null ? (
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        ) : apps.length === 0 ? (
          <Card className="p-6 text-center text-muted-foreground text-sm">You haven't applied yet.</Card>
        ) : (
          <div className="space-y-2">
            {apps.slice(0, 5).map((a) => (
              <Link key={a.id} to="/candidate/applications/$id" params={{ id: a.id }}>
                <Card className="p-4 flex items-center justify-between gap-4 hover:border-primary/50">
                  <div className="flex items-center gap-4">
                    <ScoreRing score={a.match_score} label="Match" size={64} />
                    <div>
                      <p className="font-semibold">{a.job?.title}</p>
                      <p className="text-xs text-muted-foreground">{a.job?.company}</p>
                    </div>
                  </div>
                  <StatusBadge status={a.status} />
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>
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