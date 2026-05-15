import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getApplication, updateApplicationStatus } from "@/lib/app.functions";
import { ApplicationReport } from "@/components/app/ApplicationReport";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/hr/applications/$id")({
  component: HrAppDetail,
});

function HrAppDetail() {
  const { id } = Route.useParams();
  const fetchApp = useServerFn(getApplication);
  const setStatus = useServerFn(updateApplicationStatus);
  const [data, setData] = useState<any>(null);

  const load = useCallback(() => {
    fetchApp({ data: { id } }).then(setData).catch(() => {});
  }, [fetchApp, id]);
  useEffect(() => { load(); }, [load]);

  if (!data) return <Loader2 className="h-6 w-6 animate-spin text-primary" />;

  const decide = async (status: "accepted" | "rejected") => {
    await setStatus({ data: { id, status } });
    toast.success(`Applicant ${status}`);
    load();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end gap-2 max-w-5xl mx-auto">
        <Button variant="outline" className="border-destructive/40 text-destructive hover:bg-destructive/10"
          onClick={() => decide("rejected")} disabled={data.application.status === "rejected"}>
          <XCircle className="h-4 w-4 mr-2" /> Reject
        </Button>
        <Button onClick={() => decide("accepted")} disabled={data.application.status === "accepted"}
          style={{ background: "var(--gradient-primary)" }}>
          <CheckCircle2 className="h-4 w-4 mr-2" /> Accept
        </Button>
      </div>
      <ApplicationReport application={data.application} candidate={data.candidate} hrView />
    </div>
  );
}