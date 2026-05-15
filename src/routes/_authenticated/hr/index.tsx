import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { listMyJobs } from "@/lib/app.functions";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Briefcase, PlusCircle, Users, Loader2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/hr/")({
  component: HrHome,
});

function HrHome() {
  const fetchJobs = useServerFn(listMyJobs);
  const [jobs, setJobs] = useState<any[] | null>(null);
  useEffect(() => { fetchJobs().then(setJobs).catch(() => setJobs([])); }, [fetchJobs]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Briefcase className="h-6 w-6 text-primary" /> My Jobs
          </h1>
          <p className="text-sm text-muted-foreground">Post jobs and review AI-ranked applicants.</p>
        </div>
        <Link to="/hr/jobs/new">
          <Button style={{ background: "var(--gradient-primary)" }}>
            <PlusCircle className="h-4 w-4 mr-2" /> New Job
          </Button>
        </Link>
      </div>

      {jobs === null ? (
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      ) : jobs.length === 0 ? (
        <Card className="p-8 text-center text-muted-foreground">
          No jobs yet. Click <span className="text-primary font-medium">New Job</span> to post one.
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {jobs.map((j) => (
            <Link key={j.id} to="/hr/jobs/$jobId" params={{ jobId: j.id }}>
              <Card className="p-5 hover:border-primary/50 transition-colors h-full">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="font-semibold truncate">{j.title}</h3>
                    <p className="text-xs text-muted-foreground">{j.company}</p>
                  </div>
                  <Badge variant="outline" className={j.status === "open" ? "border-primary/40 text-primary" : ""}>
                    {j.status}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2 mt-2">{j.description}</p>
                <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {j.application_count} applicants</span>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}