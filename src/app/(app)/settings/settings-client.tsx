"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input, Field } from "@/components/ui/input";

export function SettingsClient({ user }: { user: { name: string; email: string; role: string; orgName: string } }) {
  return (
    <div className="mx-auto max-w-3xl p-6">
      <h1 className="text-xl font-semibold tracking-tight">Settings</h1>
      <p className="mt-0.5 text-xs text-muted-foreground">Workspace and account configuration.</p>

      <div className="mt-6 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>Your account details</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <Field label="Name"><Input defaultValue={user.name} readOnly /></Field>
            <Field label="Email"><Input defaultValue={user.email} readOnly /></Field>
            <Field label="Role">
              <div className="pt-1"><Badge tone={user.role === "ADMIN" ? "info" : user.role === "ANALYST" ? "success" : "outline"}>{user.role}</Badge></div>
            </Field>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Organization</CardTitle>
            <CardDescription>Workspace identity</CardDescription>
          </CardHeader>
          <CardContent>
            <Field label="Organization name"><Input defaultValue={user.orgName} readOnly /></Field>
            <p className="mt-2 text-[11px] text-muted-foreground">
              Every dataset, job, source, and review is scoped to your organization and fully isolated from others.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Roles & permissions</CardTitle>
            <CardDescription>Role-based access control</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-hidden rounded-lg border border-border text-xs">
              <table className="w-full">
                <thead className="bg-muted/40 text-left text-[10px] uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2">Capability</th>
                    <th className="px-3 py-2">Admin</th>
                    <th className="px-3 py-2">Analyst</th>
                    <th className="px-3 py-2">Viewer</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["View dashboards & datasets", true, true, true],
                    ["Run pipelines / edit schema", true, true, false],
                    ["Resolve review conflicts", true, true, false],
                    ["Manage sources & members", true, false, false],
                  ].map(([cap, a, b, c]: any) => (
                    <tr key={cap} className="border-t border-border/60">
                      <td className="px-3 py-2">{cap}</td>
                      <td className="px-3 py-2">{a ? "✓" : "—"}</td>
                      <td className="px-3 py-2">{b ? "✓" : "—"}</td>
                      <td className="px-3 py-2">{c ? "✓" : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>AI provider</CardTitle>
            <CardDescription>Requirement parsing, planning, insights, copilot</CardDescription>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            DataForge uses a provider-independent AI layer. Configure <span className="font-mono text-foreground">GROQ_API_KEY</span> to
            use Groq (Llama 3.3 70B); without a key, a deterministic local engine handles parsing and planning, and analytics
            answers fall back to transparent statistics.
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
