import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { createJob } from "@/lib/app.functions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Loader2, PlusCircle, X } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/hr/jobs/new")({
  component: NewJob,
});

function NewJob() {
  const nav = useNavigate();
  const create = useServerFn(createJob);
  const [title, setTitle] = useState("");
  const [company, setCompany] = useState("");
  const [description, setDescription] = useState("");
  const [skill, setSkill] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const addSkill = () => {
    const s = skill.trim();
    if (s && !skills.includes(s)) setSkills([...skills, s]);
    setSkill("");
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const j = await create({ data: { title, company, description, required_skills: skills } });
      toast.success("Job posted!");
      nav({ to: "/hr/jobs/$jobId", params: { jobId: j.id } });
    } catch (e: any) {
      toast.error(e.message || "Failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-6 max-w-3xl mx-auto" style={{ boxShadow: "var(--shadow-glow)" }}>
      <h1 className="text-2xl font-bold flex items-center gap-2">
        <PlusCircle className="h-6 w-6 text-primary" /> Post a Job
      </h1>
      <p className="text-sm text-muted-foreground">AI will rank applicants against your description and required skills.</p>

      <form onSubmit={submit} className="space-y-4 mt-6">
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input id="title" required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Senior Frontend Engineer" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="company">Company</Label>
            <Input id="company" required value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Acme Inc." />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="desc">Description</Label>
          <Textarea id="desc" required rows={10} value={description} onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe responsibilities, requirements, what success looks like..." />
        </div>

        <div className="space-y-2">
          <Label>Required Skills</Label>
          <div className="flex gap-2">
            <Input value={skill} onChange={(e) => setSkill(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addSkill(); } }}
              placeholder="React, TypeScript, AWS..." />
            <Button type="button" variant="outline" onClick={addSkill}>Add</Button>
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            {skills.map((s) => (
              <Badge key={s} variant="outline" className="gap-1">
                {s}
                <button type="button" onClick={() => setSkills(skills.filter((x) => x !== s))}>
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        </div>

        <Button type="submit" disabled={loading} style={{ background: "var(--gradient-primary)" }}>
          {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Posting...</> : "Post job"}
        </Button>
      </form>
    </Card>
  );
}