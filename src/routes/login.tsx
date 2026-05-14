import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Sparkles, Loader2, Briefcase, User as UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", data.user.id);
      const role = roles?.[0]?.role ?? "candidate";
      toast.success("Welcome back!");
      nav({ to: role === "hr" ? "/hr" : "/candidate" });
    } catch (e: any) {
      toast.error(e.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "var(--gradient-bg)" }}>
      <Card className="w-full max-w-md p-8" style={{ boxShadow: "var(--shadow-glow)" }}>
        <Link to="/" className="flex items-center gap-2 justify-center mb-6">
          <div className="h-9 w-9 rounded-xl flex items-center justify-center" style={{ background: "var(--gradient-primary)" }}>
            <Sparkles className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-lg font-bold tracking-tight">Smart AI Resume</span>
        </Link>
        <h1 className="text-2xl font-bold text-center">Welcome back</h1>
        <p className="text-sm text-muted-foreground text-center mt-1">Sign in to your account</p>

        <form onSubmit={submit} className="space-y-4 mt-6">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <Button type="submit" className="w-full" disabled={loading} style={{ background: "var(--gradient-primary)" }}>
            {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Signing in...</> : "Sign in"}
          </Button>
        </form>

        <div className="mt-6 text-sm text-center text-muted-foreground space-y-2">
          <p>
            Don't have an account?{" "}
            <Link to="/signup" className="text-primary font-medium hover:underline">Sign up</Link>
          </p>
          <div className="flex items-center justify-center gap-3 text-xs pt-2 border-t border-border/40 mt-3">
            <span className="flex items-center gap-1"><UserIcon className="h-3 w-3" /> Candidate</span>
            <span>•</span>
            <span className="flex items-center gap-1"><Briefcase className="h-3 w-3" /> HR</span>
          </div>
        </div>
      </Card>
    </div>
  );
}