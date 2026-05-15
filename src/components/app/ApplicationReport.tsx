import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScoreRing } from "@/components/app/ScoreRing";
import { CheckCircle2, XCircle, AlertTriangle, Brain, Building2, PartyPopper, TrendingUp, Sparkles } from "lucide-react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart, Pie, Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend,
} from "recharts";

type Props = {
  application: any;
  candidate?: { full_name: string | null; email: string | null } | null;
  hrView: boolean;
};

export function ApplicationReport({ application, candidate, hrView }: Props) {
  const r = (application.report ?? {}) as any;
  const job = application.job;
  const matched = application.matched_keywords?.length ?? 0;
  const missing = application.missing_keywords?.length ?? 0;
  const totalKw = matched + missing || 1;
  const keywordCoverage = Math.round((matched / totalKw) * 100);
  const priorityCounts = (r.improvements ?? []).reduce(
    (acc: any, i: any) => ((acc[i.priority] = (acc[i.priority] ?? 0) + 1), acc),
    { high: 0, medium: 0, low: 0 },
  );

  const scoreBars = [
    { name: "Match", value: application.match_score ?? 0 },
    { name: "ATS", value: application.ats_score ?? 0 },
    { name: "Keywords", value: keywordCoverage },
  ];
  const kwPie = [
    { name: "Matched", value: matched },
    { name: "Missing", value: missing },
  ];
  const radarData = [
    { axis: "Match", v: application.match_score ?? 0 },
    { axis: "ATS", v: application.ats_score ?? 0 },
    { axis: "Keywords", v: keywordCoverage },
    { axis: "Strengths", v: Math.min(100, (r.strengths?.length ?? 0) * 20) },
    { axis: "Polish", v: Math.max(0, 100 - (priorityCounts.high * 20 + priorityCounts.medium * 10)) },
  ];
  const PIE_COLORS = ["hsl(var(--primary))", "hsl(var(--destructive))"];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {!hrView && application.status === "accepted" && (
        <Card className="p-5 border-primary/40 bg-primary/10 flex items-center gap-3" style={{ boxShadow: "var(--shadow-glow)" }}>
          <PartyPopper className="h-8 w-8 text-primary shrink-0" />
          <div>
            <h3 className="font-bold text-primary text-lg">You've been shortlisted! 🎉</h3>
            <p className="text-sm text-foreground/80">The hiring team has accepted your application{job ? ` for ${job.title} at ${job.company}` : ""}. Expect to hear from them soon.</p>
          </div>
        </Card>
      )}
      {!hrView && application.status === "rejected" && (
        <Card className="p-5 border-destructive/40 bg-destructive/5 flex items-center gap-3">
          <XCircle className="h-7 w-7 text-destructive shrink-0" />
          <div>
            <h3 className="font-bold text-destructive">Application not selected</h3>
            <p className="text-sm text-muted-foreground">Use the suggestions below to strengthen your profile for the next opportunity.</p>
          </div>
        </Card>
      )}

      <Card className="p-6" style={{ boxShadow: "var(--shadow-glow)" }}>
        <div className="flex flex-col md:flex-row items-center gap-8 justify-around">
          <ScoreRing score={application.match_score} label="Match Score" />
          <ScoreRing score={application.ats_score} label="ATS Compatibility" size={120} />
          <ScoreRing score={keywordCoverage} label="Keyword Coverage" size={120} />
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

      <Tabs defaultValue="overview">
        <TabsList className="grid grid-cols-3 sm:grid-cols-6 w-full bg-card/60">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="keywords">Keywords</TabsTrigger>
          <TabsTrigger value="improvements">Improvements</TabsTrigger>
          <TabsTrigger value="rewrites">Rewrites</TabsTrigger>
          <TabsTrigger value="interview">Interview</TabsTrigger>
          <TabsTrigger value="skills">Skill Gap</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4 grid lg:grid-cols-2 gap-4">
          <Card className="p-5">
            <h3 className="font-semibold flex items-center gap-2 mb-4">
              <TrendingUp className="h-4 w-4 text-primary" /> Score Breakdown
            </h3>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={scoreBars} layout="vertical" margin={{ left: 20, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" domain={[0, 100]} stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis type="category" dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                  <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card className="p-5">
            <h3 className="font-semibold flex items-center gap-2 mb-4">
              <Sparkles className="h-4 w-4 text-primary" /> Profile Radar
            </h3>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid stroke="hsl(var(--border))" />
                  <PolarAngleAxis dataKey="axis" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                  <PolarRadiusAxis domain={[0, 100]} stroke="hsl(var(--muted-foreground))" fontSize={10} />
                  <Radar name="You" dataKey="v" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.4} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card className="p-5">
            <h3 className="font-semibold flex items-center gap-2 mb-4">
              <CheckCircle2 className="h-4 w-4 text-primary" /> Keyword Match
            </h3>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={kwPie} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={4}>
                    {kwPie.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card className="p-5">
            <h3 className="font-semibold flex items-center gap-2 mb-4">
              <AlertTriangle className="h-4 w-4 text-accent" /> Areas of Improvement
            </h3>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={[
                  { name: "High", count: priorityCounts.high },
                  { name: "Medium", count: priorityCounts.medium },
                  { name: "Low", count: priorityCounts.low },
                ]}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis allowDecimals={false} stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                  <Bar dataKey="count" fill="hsl(var(--accent))" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {(r.strengths?.length || r.weaknesses?.length) && (
            <Card className="p-5 lg:col-span-2 grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-primary mb-2 flex items-center gap-2"><CheckCircle2 className="h-4 w-4" /> Strengths</h4>
                <ul className="space-y-1 text-sm text-foreground/80 list-disc pl-5">
                  {(r.strengths ?? []).map((s: string, i: number) => <li key={i}>{s}</li>)}
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-destructive mb-2 flex items-center gap-2"><XCircle className="h-4 w-4" /> Weaknesses</h4>
                <ul className="space-y-1 text-sm text-foreground/80 list-disc pl-5">
                  {(r.weaknesses ?? []).map((s: string, i: number) => <li key={i}>{s}</li>)}
                </ul>
              </div>
            </Card>
          )}
        </TabsContent>

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