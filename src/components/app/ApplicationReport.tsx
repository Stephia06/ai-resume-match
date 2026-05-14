import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScoreRing } from "@/components/app/ScoreRing";
import { CheckCircle2, XCircle, AlertTriangle, Brain, Building2 } from "lucide-react";

type Props = {
  application: any;
  candidate?: { full_name: string | null; email: string | null } | null;
  hrView: boolean;
};

export function ApplicationReport({ application, candidate, hrView }: Props) {
  const r = (application.report ?? {}) as any;
  const job = application.job;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <Card className="p-6" style={{ boxShadow: "var(--shadow-glow)" }}>
        <div className="flex flex-col md:flex-row items-center gap-8 justify-around">
          <ScoreRing score={application.match_score} label="Match Score" />
          <ScoreRing score={application.ats_score} label="ATS Compatibility" size={120} />
          <div className="flex-1 max-w-md text-center md:text-left">
            {job && (
              <p className="text-xs text-muted-foreground flex items-center gap-1 justify-center md:justify-start">
                <Building2 className="h-3 w-3" /> {job.company} · {job.title}
              </p>
            )}
            {hrView && candidate && (
              <p className="text-sm font-semibold mt-1">{candidate.full_name} <span className="text-muted-foreground font-normal">{candidate.email}</span></p>
            )}
            <p className="mt-3 text-lg font-medium text-foreground/90 italic">"{application.verdict}"</p>
          </div>
        </div>
      </Card>

      <Tabs defaultValue="keywords">
        <TabsList className="grid grid-cols-2 sm:grid-cols-5 w-full bg-card/60">
          <TabsTrigger value="keywords">Keywords</TabsTrigger>
          <TabsTrigger value="improvements">Improvements</TabsTrigger>
          <TabsTrigger value="rewrites">Rewrites</TabsTrigger>
          <TabsTrigger value="interview">Interview</TabsTrigger>
          <TabsTrigger value="skills">Skill Gap</TabsTrigger>
        </TabsList>

        <TabsContent value="keywords" className="mt-4 grid md:grid-cols-2 gap-4">
          <Card className="p-5">
            <h3 className="font-semibold flex items-center gap-2 mb-3">
              <CheckCircle2 className="h-4 w-4 text-primary" /> Matched ({application.matched_keywords?.length ?? 0})
            </h3>
            <div className="flex flex-wrap gap-2">
              {application.matched_keywords?.map((k: string) => (
                <Badge key={k} className="bg-primary/15 text-primary border-primary/30">{k}</Badge>
              ))}
            </div>
          </Card>
          <Card className="p-5">
            <h3 className="font-semibold flex items-center gap-2 mb-3">
              <XCircle className="h-4 w-4 text-destructive" /> Missing ({application.missing_keywords?.length ?? 0})
            </h3>
            <div className="flex flex-wrap gap-2">
              {application.missing_keywords?.map((k: string) => (
                <Badge key={k} variant="outline" className="border-destructive/40 text-destructive">{k}</Badge>
              ))}
            </div>
          </Card>
          {r.tailoredSummary && (
            <Card className="p-5 md:col-span-2">
              <h3 className="font-semibold mb-2">AI-Tailored Summary</h3>
              <p className="text-sm text-foreground/80 italic">{r.tailoredSummary}</p>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="improvements" className="mt-4 space-y-3">
          {(r.improvements ?? []).map((imp: any, i: number) => (
            <Card key={i} className="p-4 flex gap-3">
              <Badge variant="outline" className={
                imp.priority === "high" ? "border-destructive text-destructive"
                : imp.priority === "medium" ? "border-accent text-accent"
                : "border-muted-foreground text-muted-foreground"
              }>{imp.priority}</Badge>
              <div>
                <p className="font-medium text-sm">{imp.section}</p>
                <p className="text-sm text-muted-foreground mt-1">{imp.suggestion}</p>
              </div>
            </Card>
          ))}
          {r.redFlags?.length > 0 && (
            <Card className="p-5 border-destructive/30">
              <h3 className="font-semibold flex items-center gap-2 mb-2 text-destructive">
                <AlertTriangle className="h-4 w-4" /> Red Flags
              </h3>
              <ul className="space-y-1 text-sm text-muted-foreground list-disc pl-5">
                {r.redFlags.map((x: string, i: number) => <li key={i}>{x}</li>)}
              </ul>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="rewrites" className="mt-4 space-y-3">
          {(r.rewrittenBullets ?? []).map((b: any, i: number) => (
            <Card key={i} className="p-4 grid md:grid-cols-2 gap-3">
              <div>
                <p className="text-xs uppercase text-muted-foreground mb-1">Original</p>
                <p className="text-sm text-foreground/70">{b.original}</p>
              </div>
              <div>
                <p className="text-xs uppercase text-primary mb-1">AI-Improved</p>
                <p className="text-sm font-medium">{b.improved}</p>
              </div>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="interview" className="mt-4 space-y-3">
          {(r.interviewQuestions ?? []).map((q: any, i: number) => (
            <Card key={i} className="p-5">
              <p className="font-semibold flex items-start gap-2">
                <Brain className="h-4 w-4 text-primary mt-1 shrink-0" /> {q.question}
              </p>
              <p className="text-sm text-muted-foreground mt-2 pl-6">{q.sampleAnswer}</p>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="skills" className="mt-4 space-y-3">
          {(r.skillGapPlan ?? []).map((s: any, i: number) => (
            <Card key={i} className="p-5">
              <h4 className="font-semibold text-primary">{s.skill}</h4>
              <p className="text-sm text-muted-foreground mt-1">{s.whyItMatters}</p>
              <p className="text-sm mt-2"><span className="text-muted-foreground">Resource: </span>{s.resource}</p>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}