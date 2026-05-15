import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getJob, submitApplication } from "@/lib/app.functions";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Building2, Briefcase, Upload, Loader2, Sparkles, FileText } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/candidate/jobs/$jobId")({
  component: JobDetail,
});

function JobDetail() {
  const { jobId } = Route.useParams();
  const nav = useNavigate();
  const fetchJob = useServerFn(getJob);
  const apply = useServerFn(submitApplication);
  const [data, setData] = useState<any>(null);
  const [resumeText, setResumeText] = useState("");
  const [fileName, setFileName] = useState("");
  const [parsing, setParsing] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchJob({ data: { jobId } }).then(setData).catch((e) => toast.error(e.message));
  }, [fetchJob, jobId]);

  const handleFile = async (file: File) => {
    setParsing(true);
    try {
      const { parseResumeFile } = await import("@/lib/parseResume");
      const text = await parseResumeFile(file);
      if (text.length < 50) throw new Error("Could not extract enough text.");
      setResumeText(text);
      setFileName(file.name);
      toast.success(`Parsed ${file.name}`);
    } catch (e: any) {
      toast.error(e.message || "Parse failed");
    } finally {
      setParsing(false);
    }
  };

  const onSubmit = async () => {
    if (!resumeText) return toast.error("Upload your resume first");
    setSubmitting(true);
    try {
      const res = await apply({ data: { jobId, resumeText, fileName } });
      toast.success(`Applied! Match score ${res.matchScore}`);
      nav({ to: "/candidate/applications/$id", params: { id: res.id } });
    } catch (e: any) {
      toast.error(e.message || "Failed to submit");
    } finally {
      setSubmitting(false);
    }
  };

  if (!data) return <Loader2 className="h-6 w-6 animate-spin text-primary" />;
  const { job, myApplication } = data;

  return (
    <div className="grid lg:grid-cols-[1fr_380px] gap-6 max-w-6xl mx-auto">
      <Card className="p-6">
        <div className="flex items-start gap-3">
          <div className="h-12 w-12 rounded-lg bg-primary/15 flex items-center justify-center">
            <Briefcase className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{job.title}</h1>
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <Building2 className="h-3 w-3" /> {job.company}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-1 mt-4">
          {job.required_skills.map((s: string) => <Badge key={s} variant="outline">{s}</Badge>)}
        </div>
        <div className="prose prose-invert prose-sm max-w-none mt-6 whitespace-pre-wrap text-foreground/90">
          {job.description}
        </div>
      </Card>

      <Card className="p-6 h-fit sticky top-20" style={{ boxShadow: "var(--shadow-glow)" }}>
        <h2 className="font-semibold flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary" /> Apply with AI</h2>
        {myApplication ? (
          <div className="mt-4 space-y-3">
            <p className="text-sm text-muted-foreground">You already applied with a <span className="text-primary font-semibold">{myApplication.match_score}%</span> match.</p>
            <Button className="w-full" variant="outline" onClick={() => nav({ to: "/candidate/applications/$id", params: { id: myApplication.id } })}>
              View report
            </Button>
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            <label className="block">
              <div className="border-2 border-dashed border-border rounded-lg p-4 text-center cursor-pointer hover:border-primary/50 transition-colors">
                {parsing ? <Loader2 className="h-5 w-5 animate-spin mx-auto text-primary" /> : (
                  <>
                    <Upload className="h-5 w-5 mx-auto text-muted-foreground" />
                    <p className="text-xs text-muted-foreground mt-2">{fileName || "PDF, DOCX, or TXT"}</p>
                  </>
                )}
              </div>
              <input type="file" accept=".pdf,.docx,.txt" className="hidden" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
            </label>
            {resumeText && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <FileText className="h-3 w-3" /> {resumeText.length} chars parsed
              </p>
            )}
            <Button className="w-full" disabled={!resumeText || submitting} onClick={onSubmit} style={{ background: "var(--gradient-primary)" }}>
              {submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Analyzing...</> : "Submit application"}
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}