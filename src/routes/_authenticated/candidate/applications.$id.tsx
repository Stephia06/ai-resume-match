import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getApplication } from "@/lib/app.functions";
import { ApplicationReport } from "@/components/app/ApplicationReport";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/candidate/applications/$id")({
  component: AppDetail,
});

function AppDetail() {
  const { id } = Route.useParams();
  const fetchApp = useServerFn(getApplication);
  const [data, setData] = useState<any>(null);
  useEffect(() => { fetchApp({ data: { id } }).then(setData).catch(() => {}); }, [fetchApp, id]);
  if (!data) return <Loader2 className="h-6 w-6 animate-spin text-primary" />;
  return <ApplicationReport application={data.application} hrView={false} />;
}