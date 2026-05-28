import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { listAllUsers } from "@/lib/admin.functions";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Shield, Search } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/")({
  component: AdminUsers,
});

function AdminUsers() {
  const fetchUsers = useServerFn(listAllUsers);
  const [users, setUsers] = useState<any[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [q, setQ] = useState("");

  useEffect(() => {
    fetchUsers()
      .then(setUsers)
      .catch((e) => setErr(e.message ?? "Failed to load users"));
  }, [fetchUsers]);

  const filtered = (users ?? []).filter((u) => {
    const s = q.toLowerCase();
    return (
      !s ||
      u.email?.toLowerCase().includes(s) ||
      u.full_name?.toLowerCase().includes(s) ||
      u.roles?.some((r: string) => r.toLowerCase().includes(s))
    );
  });

  const fmt = (d: string | null) =>
    d ? new Date(d).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" }) : "—";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Shield className="h-6 w-6 text-primary" /> Admin · All Users
        </h1>
        <p className="text-sm text-muted-foreground">
          Manage candidates and HR accounts. Click a row for full details.
        </p>
      </div>

      {err && <Card className="p-4 text-destructive">{err}</Card>}

      <Card className="p-4">
        <div className="relative max-w-sm mb-4">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by email, name or role…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="pl-9"
          />
        </div>

        {users === null ? (
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        ) : filtered.length === 0 ? (
          <p className="text-muted-foreground text-sm p-4">No users found.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Last sign-in</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((u) => {
                const banned = u.banned_until && new Date(u.banned_until) > new Date();
                const confirmed = !!u.email_confirmed_at;
                return (
                  <TableRow key={u.id} className="cursor-pointer">
                    <TableCell>
                      <Link to="/admin/users/$userId" params={{ userId: u.id }} className="text-primary hover:underline">
                        {u.email ?? "—"}
                      </Link>
                    </TableCell>
                    <TableCell>{u.full_name ?? "—"}</TableCell>
                    <TableCell>
                      <div className="flex gap-1 flex-wrap">
                        {(u.roles ?? []).map((r: string) => (
                          <Badge key={r} variant="outline" className="uppercase text-xs">{r}</Badge>
                        ))}
                        {!u.roles?.length && <span className="text-muted-foreground text-xs">none</span>}
                      </div>
                    </TableCell>
                    <TableCell>
                      {banned ? (
                        <Badge variant="destructive">Banned</Badge>
                      ) : confirmed ? (
                        <Badge className="bg-primary/15 text-primary border-primary/30">Active</Badge>
                      ) : (
                        <Badge variant="outline">Unconfirmed</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{fmt(u.created_at)}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{fmt(u.last_sign_in_at)}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}