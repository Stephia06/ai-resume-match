import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Sparkles, Upload, FileText, Target, Brain, MessageSquare, GraduationCap, AlertTriangle, CheckCircle2, XCircle, Wand2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { parseResumeFile } from "@/lib/parseResume";
import { analyzeResume } from "@/server/analyze.functions";
import { ScoreRing } from "@/components/app/ScoreRing";

export const Route = createFileRoute("/")({
  component: Index,
});

type Report = Awaited<ReturnType<typeof analyzeResume>>;

function Index() {
  const analyze = useServerFn(analyzeResume);
  const [resumeText, setResumeText] = useState("");
  const [fileName, setFileName] = useState("");
  const [jd, setJd] = useState("");
  const [loading, setLoading] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [report, setReport] = useState<Report | null>(null);

  const handleFile = async (file: File) => {
    setParsing(true);
    try {
      const text = await parseResumeFile(file);
      if (text.length < 50) throw new Error("Could not extract enough text from this file.");
      setResumeText(text);
      setFileName(file.name);
      toast.success(`Parsed ${file.name}`);
    } catch (e: any) {
      toast.error(e.message || "Failed to parse file");
    } finally {
      setParsing(false);
    }
  };

  const onAnalyze = async () => {
    if (!resumeText || !jd) {
      toast.error("Upload a resume and paste a job description.");
      return;
    }
    setLoading(true);
    setReport(null);
    try {
      const r = await analyze({ data: { resumeText, jobDescription: jd } });
      setReport(r);
      toast.success("Analysis complete!");
      setTimeout(() => document.getElementById("report")?.scrollIntoView({ behavior: "smooth" }), 100);
    } catch (e: any) {
      toast.error(e.message || "Analysis failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen" style={{ background: "var(--gradient-bg)" }}>
      <Toaster theme="dark" position="top-center" />

      {/* Header */}
      <header className="container mx-auto px-4 py-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-xl flex items-center justify-center" style={{ background: "var(--gradient-primary)" }}>
            <Sparkles className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-lg font-bold tracking-tight">Smart AI Resume</span>
        </div>
        <Badge variant="outline" className="hidden sm:inline-flex border-primary/40 text-primary">
          AI-Powered ATS
        </Badge>
      </header>

      {/* Hero */}
      <section className="container mx-auto px-4 pt-8 pb-12 text-center">
        <h1 className="text-4xl sm:text-6xl font-bold tracking-tight max-w-3xl mx-auto leading-tight">
          Beat the bots.{" "}
          <span className="bg-clip-text text-transparent" style={{ backgroundImage: "var(--gradient-primary)" }}>
            Land the interview.
          </span>
        </h1>
        <p className="mt-4 text-muted-foreground max-w-2xl mx-auto text-lg">
          Upload your resume, paste any job description, and get an AI-powered ATS score with tailored rewrites, interview prep, and a personalized skill-gap plan.
        </p>
      </section>

      {/* Form */}
      <section className="container mx-auto px-4 pb-16">
        <Card className="p-6 sm:p-8 grid md:grid-cols-2 gap-6 border-border/60" style={{ boxShadow: "var(--shadow-glow)" }}>
          {/* Resume upload */}
          <div className="space-y-3">
            <label className="text-sm font-semibold flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" /> Your Resume
            </label>
            <label className="block border-2 border-dashed border-border hover:border-primary/60 rounded-xl p-8 text-center cursor-pointer transition-colors bg-muted/30">
              <input
                type="file"
                accept=".pdf,.docx,.doc,.txt"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
              />
              {parsing ? (
                <Loader2 className="h-8 w-8 mx-auto animate-spin text-primary" />
              ) : (
                <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
              )}
              <p className="mt-3 text-sm font-medium">
                {fileName || "Drop your PDF, DOCX, or TXT file"}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {resumeText ? `${resumeText.length.toLocaleString()} chars extracted` : "Click to browse"}
              </p>
            </label>
          </div>

          {/* JD */}
          <div className="space-y-3">
            <label className="text-sm font-semibold flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" /> Job Description
            </label>
            <Textarea
              placeholder="Paste the full job description here..."
              value={jd}
              onChange={(e) => setJd(e.target.value)}
              className="min-h-[180px] resize-none bg-muted/30"
            />
          </div>

          <div className="md:col-span-2 flex justify-center">
            <Button
              size="lg"
              onClick={onAnalyze}
              disabled={loading || !resumeText || !jd}
              className="text-primary-foreground font-semibold px-8"
              style={{ background: "var(--gradient-primary)" }}
            >
              {loading ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Analyzing...</>
              ) : (
                <><Sparkles className="mr-2 h-4 w-4" /> Analyze with AI</>
              )}
            </Button>
          </div>
        </Card>

        {/* Features grid */}
        {!report && !loading && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-10">
            {[
              { icon: Target, t: "ATS Match Score", d: "Precise scoring against the JD" },
              { icon: Wand2, t: "AI Rewrites", d: "Bullets tailored to the role" },
              { icon: MessageSquare, t: "Interview Prep", d: "Likely questions & answers" },
              { icon: GraduationCap, t: "Skill-Gap Plan", d: "What to learn & where" },
            ].map((f) => (
              <Card key={f.t} className="p-5 bg-card/60 border-border/60">
                <f.icon className="h-6 w-6 text-primary mb-2" />
                <h3 className="font-semibold">{f.t}</h3>
                <p className="text-sm text-muted-foreground mt-1">{f.d}</p>
              </Card>
            ))}
          </div>
        )}

        {/* Report */}
        {report && (
          <div id="report" className="mt-12 space-y-6">
            <Card className="p-6 sm:p-8" style={{ boxShadow: "var(--shadow-glow)" }}>
              <div className="flex flex-col md:flex-row items-center gap-8 justify-around">
                <ScoreRing score={report.matchScore} label="Match Score" />
                <ScoreRing score={report.atsCompatibility} label="ATS Compatibility" size={120} />
                <p className="flex-1 text-center md:text-left text-lg font-medium text-foreground/90 max-w-md">
                  "{report.verdict}"
                </p>
              </div>
            </Card>

            <Tabs defaultValue="keywords" className="w-full">
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
                    <CheckCircle2 className="h-4 w-4 text-primary" /> Matched ({report.matchedKeywords.length})
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {report.matchedKeywords.map((k: string) => (
                      <Badge key={k} className="bg-primary/15 text-primary border-primary/30 hover:bg-primary/20">{k}</Badge>
                    ))}
                  </div>
                </Card>
                <Card className="p-5">
                  <h3 className="font-semibold flex items-center gap-2 mb-3">
                    <XCircle className="h-4 w-4 text-destructive" /> Missing ({report.missingKeywords.length})
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {report.missingKeywords.map((k: string) => (
                      <Badge key={k} variant="outline" className="border-destructive/40 text-destructive">{k}</Badge>
                    ))}
                  </div>
                </Card>

                <Card className="p-5 md:col-span-2">
                  <h3 className="font-semibold mb-2">AI-Tailored Summary</h3>
                  <p className="text-sm text-foreground/80 leading-relaxed italic">{report.tailoredSummary}</p>
                </Card>
              </TabsContent>

              <TabsContent value="improvements" className="mt-4 space-y-3">
                {report.improvements.map((imp: any, i: number) => (
                  <Card key={i} className="p-4 flex gap-3">
                    <Badge
                      variant="outline"
                      className={
                        imp.priority === "high" ? "border-destructive text-destructive"
                        : imp.priority === "medium" ? "border-accent text-accent"
                        : "border-muted-foreground text-muted-foreground"
                      }
                    >
                      {imp.priority}
                    </Badge>
                    <div>
                      <p className="font-medium text-sm">{imp.section}</p>
                      <p className="text-sm text-muted-foreground mt-1">{imp.suggestion}</p>
                    </div>
                  </Card>
                ))}
                {report.redFlags.length > 0 && (
                  <Card className="p-5 border-destructive/30">
                    <h3 className="font-semibold flex items-center gap-2 mb-2 text-destructive">
                      <AlertTriangle className="h-4 w-4" /> Red Flags
                    </h3>
                    <ul className="space-y-1 text-sm text-muted-foreground list-disc pl-5">
                      {report.redFlags.map((r: string, i: number) => <li key={i}>{r}</li>)}
                    </ul>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="rewrites" className="mt-4 space-y-3">
                {report.rewrittenBullets.map((b: any, i: number) => (
                  <Card key={i} className="p-4 grid md:grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Original</p>
                      <p className="text-sm text-foreground/70">{b.original}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-primary mb-1">AI-Improved</p>
                      <p className="text-sm text-foreground font-medium">{b.improved}</p>
                    </div>
                  </Card>
                ))}
              </TabsContent>

              <TabsContent value="interview" className="mt-4 space-y-3">
                {report.interviewQuestions.map((q: any, i: number) => (
                  <Card key={i} className="p-5">
                    <p className="font-semibold flex items-start gap-2">
                      <Brain className="h-4 w-4 text-primary mt-1 shrink-0" />
                      {q.question}
                    </p>
                    <p className="text-sm text-muted-foreground mt-2 pl-6">{q.sampleAnswer}</p>
                  </Card>
                ))}
              </TabsContent>

              <TabsContent value="skills" className="mt-4 space-y-3">
                {report.skillGapPlan.map((s: any, i: number) => (
                  <Card key={i} className="p-5">
                    <h4 className="font-semibold text-primary">{s.skill}</h4>
                    <p className="text-sm text-muted-foreground mt-1">{s.whyItMatters}</p>
                    <p className="text-sm mt-2"><span className="text-muted-foreground">Resource: </span>{s.resource}</p>
                  </Card>
                ))}
              </TabsContent>
            </Tabs>
          </div>
        )}
      </section>

      <footer className="container mx-auto px-4 py-8 text-center text-xs text-muted-foreground border-t border-border/40">
        Built with ❤️ — Smart AI Resume
      </footer>
    </div>
  );
}
