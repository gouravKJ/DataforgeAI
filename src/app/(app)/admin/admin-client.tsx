"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Shield } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/input";
import { Skeleton, EmptyState } from "@/components/ui/skeleton";
import { formatNumber, timeAgo } from "@/lib/utils";

type Stats = { organizations: number; users: number; datasets: number; records: number; jobs: number; ai: { provider: string; model: string } };
type UserRow = { id: string; name: string; email: string; role: string; createdAt: string; lastLoginAt: string | null };

export function AdminClient() {
  const qc = useQueryClient();
  const { data: stats } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const res = await fetch("/api/admin/stats");
      if (res.status === 403) return null;
      return (await res.json()) as Stats;
    },
  });

  const { data: users } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const res = await fetch("/api/admin/users");
      if (res.status === 403) return null;
      return (await res.json()) as { users: UserRow[] };
    },
  });

  async function setRole(userId: string, role: string) {
    await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, role }),
    });
    qc.invalidateQueries({ queryKey: ["admin-users"] });
  }

  if (stats === null) {
    return <div className="p-6"><EmptyState title="Admin access required" description="Your role does not permit this page." /></div>;
  }

  return (
    <div className="mx-auto max-w-5xl p-6">
      <div>
        <h1 className="flex items-center gap-2 text-xl font-semibold tracking-tight"><Shield className="h-5 w-5 text-primary" /> Admin</h1>
        <p className="mt-0.5 text-xs text-muted-foreground">Workspace-level administration.</p>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
        <Stat k="Organizations" v={stats ? formatNumber(stats.organizations) : "—"} />
        <Stat k="Users" v={stats ? formatNumber(stats.users) : "—"} />
        <Stat k="Datasets" v={stats ? formatNumber(stats.datasets) : "—"} />
        <Stat k="Records" v={stats ? formatNumber(stats.records) : "—"} />
        <Stat k="Jobs" v={stats ? formatNumber(stats.jobs) : "—"} />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>AI subsystem</CardTitle>
            <CardDescription>Provider and model in use</CardDescription>
          </CardHeader>
          <CardContent className="text-xs">
            <div className="flex items-center gap-2">
              <Badge tone={stats?.ai.provider === "groq" ? "success" : "warning"}>
                {stats?.ai.provider === "groq" ? "Groq connected" : "Local fallback"}
              </Badge>
              <span className="font-mono text-muted-foreground">{stats?.ai.model}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Team members</CardTitle>
            <CardDescription>Roles control write access</CardDescription>
          </CardHeader>
          <CardContent>
            {!users ? (
              <p className="text-xs text-muted-foreground">Requires admin role.</p>
            ) : (
              <div className="space-y-2">
                {users.users.map((u) => (
                  <div key={u.id} className="flex items-center gap-2 text-xs">
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-medium">{u.name}</div>
                      <div className="truncate text-[10px] text-muted-foreground">{u.email} · joined {timeAgo(u.createdAt)}</div>
                    </div>
                    <Select value={u.role} onChange={(e) => setRole(u.id, e.target.value)} className="h-7 w-28 py-0 text-xs">
                      <option>ADMIN</option>
                      <option>ANALYST</option>
                      <option>VIEWER</option>
                    </Select>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Stat({ k, v }: { k: string; v: string }) {
  return (
    <Card className="p-3.5">
      <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{k}</div>
      <div className="mt-1 text-lg font-semibold tabular-nums">{v}</div>
    </Card>
  );
}
