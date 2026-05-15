import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Sparkles, Loader2, Briefcase, User as UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/signup")({
  component: SignupPage,
});

function SignupPage() {
  const nav = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"candidate" | "hr">("candidate");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/${role}`,
          data: { full_name: fullName, role },
        },
      });
      if (error) throw error;
      toast.success("Account created!");
      nav({ to: role === "hr" ? "/hr" : "/candidate" });
    } catch (e: any) {
      toast.error(e.message || "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12" style={{ background: "var(--gradient-bg)" }}>
      <Card className="w-full max-w-md p-8" style={{ boxShadow: "var(--shadow-glow)" }}>
        <Link to="/" className="flex items-center gap-2 justify-center mb-6">
          <div className="h-9 w-9 rounded-xl flex items-center justify-center" style={{ background: "var(--gradient-primary)" }}>
            <Sparkles className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-lg font-bold tracking-tight">Smart AI Resume</span>
        </Link>
        <h1 className="text-2xl font-bold text-center">Create your account</h1>
        <p className="text-sm text-muted-foreground text-center mt-1">Choose your role to get started</p>

        <div className="grid grid-cols-2 gap-2 mt-6 p-1 bg-muted/40 rounded-lg">
          <button
            type="button"
            onClick={() => setRole("candidate")}
            className={cn(
              "flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-colors",
              role === "candidate" ? "bg-primary/15 text-primary" : "text-muted-foreground"
            )}
          >
            <UserIcon className="h-4 w-4" /> Candidate
          </button>
          <button
            type="button"
            onClick={() => setRole("hr")}
            className={cn(
              "flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-colors",
              role === "hr" ? "bg-primary/15 text-primary" : "text-muted-foreground"
            )}
          >
            <Briefcase className="h-4 w-4" /> HR / Recruiter
          </button>
        </div>

        <form onSubmit={submit} className="space-y-4 mt-6">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input id="name" required value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <Button type="submit" className="w-full" disabled={loading} style={{ background: "var(--gradient-primary)" }}>
            {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creating...</> : "Create account"}
          </Button>
        </form>

        <p className="mt-6 text-sm text-center text-muted-foreground">
          Already have an account?{" "}
          <Link to="/login" className="text-primary font-medium hover:underline">Sign in</Link>
        </p>
      </Card>
    </div>
  );
}