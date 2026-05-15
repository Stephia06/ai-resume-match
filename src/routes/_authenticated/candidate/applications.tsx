import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { listMyApplications } from "@/lib/app.functions";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScoreRing } from "@/components/app/ScoreRing";
import { FileText, Loader2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/candidate/applications")({
  component: MyApps,
});

function MyApps() {
  const fetchApps = useServerFn(listMyApplications);
  const [apps, setApps] = useState<any[] | null>(null);
  useEffect(() => { fetchApps().then(setApps).catch(() => setApps([])); }, [fetchApps]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <FileText className="h-6 w-6 text-primary" /> My Applications
        </h1>
        <p className="text-sm text-muted-foreground">Track your applications and AI match scores.</p>
      </div>
      {apps === null ? (
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      ) : apps.length === 0 ? (
        <Card className="p-8 text-center text-muted-foreground">
          No applications yet. <Link to="/candidate" className="text-primary hover:underline">Browse jobs</Link>.
        </Card>
      ) : (
        <div className="space-y-2">
          {apps.map((a) => (
            <Link key={a.id} to="/candidate/applications/$id" params={{ id: a.id }}>
              <Card className="p-4 flex items-center justify-between gap-4 hover:border-primary/50">
                <div className="flex items-center gap-4">
                  <ScoreRing score={a.match_score} label="Match" size={64} />
                  <div>
                    <p className="font-semibold">{a.job?.title}</p>
                    <p className="text-xs text-muted-foreground">{a.job?.company}</p>
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