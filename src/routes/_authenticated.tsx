import { createFileRoute, Outlet, Link, useNavigate, useLocation } from "@tanstack/react-router";
import { useEffect } from "react";
import { Sparkles, LogOut, LayoutDashboard, Briefcase, FileText, PlusCircle } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated")({
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const { user, role, loading, signOut } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();

  useEffect(() => {
    if (!loading && !user) nav({ to: "/login" });
  }, [user, loading, nav]);

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--gradient-bg)" }}>
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  const candidateLinks = [
    { to: "/candidate", label: "Browse Jobs", icon: LayoutDashboard },
    { to: "/candidate/applications", label: "My Applications", icon: FileText },
  ];
  const hrLinks = [
    { to: "/hr", label: "My Jobs", icon: Briefcase },
    { to: "/hr/jobs/new", label: "Post Job", icon: PlusCircle },
  ];
  const links = role === "hr" ? hrLinks : candidateLinks;

  return (
    <div className="min-h-screen" style={{ background: "var(--gradient-bg)" }}>
      <header className="border-b border-border/40 bg-card/40 backdrop-blur sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ background: "var(--gradient-primary)" }}>
              <Sparkles className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-bold tracking-tight hidden sm:inline">Smart AI Resume</span>
          </Link>

          <nav className="flex items-center gap-1">
            {links.map((l) => {
              const active = loc.pathname === l.to || (l.to !== "/candidate" && l.to !== "/hr" && loc.pathname.startsWith(l.to));
              return (
                <Link
                  key={l.to}
                  to={l.to}
                  className={cn(
                    "px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-colors",
                    active ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
                  )}
                >
                  <l.icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{l.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground hidden md:inline">
              {user.email} · <span className="text-primary uppercase">{role}</span>
            </span>
            <Button variant="ghost" size="sm" onClick={signOut}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}