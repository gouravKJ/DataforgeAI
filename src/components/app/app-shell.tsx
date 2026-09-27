"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Boxes, LayoutDashboard, Wand2, Workflow, Database, Plug, Search, Sparkles,
  Gauge, ClipboardCheck, History, Settings, Shield, LogOut, Menu, X,
} from "lucide-react";
import { useState } from "react";
import { cn, initials } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const NAV = [
  { section: "Intelligence", items: [
    { href: "/dashboard", label: "Command Center", icon: LayoutDashboard },
    { href: "/build", label: "Data Builder", icon: Wand2 },
    { href: "/workflows", label: "Workflows", icon: Workflow },
    { href: "/datasets", label: "Datasets", icon: Database },
  ]},
  { section: "Data Ops", items: [
    { href: "/sources", label: "Sources", icon: Plug },
    { href: "/search", label: "Search", icon: Search },
    { href: "/copilot", label: "Copilot", icon: Sparkles },
    { href: "/quality", label: "Quality", icon: Gauge },
    { href: "/reviews", label: "Reviews", icon: ClipboardCheck },
  ]},
  { section: "Workspace", items: [
    { href: "/history", label: "History", icon: History },
    { href: "/settings", label: "Settings", icon: Settings },
    { href: "/admin", label: "Admin", icon: Shield, adminOnly: true },
  ]},
];

export function AppShellClient({
  user,
  children,
}: {
  user: { name: string; email: string; role: string; org: { name: string } };
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex h-14 items-center gap-2.5 border-b border-border px-4">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/15">
          <Boxes className="h-4 w-4 text-primary" />
        </div>
        <span className="text-sm font-semibold tracking-tight">DataForge AI</span>
      </div>

      <div className="border-b border-border px-4 py-3">
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Organization</div>
        <div className="mt-1 truncate text-sm font-medium">{user.org.name}</div>
      </div>

      <nav className="flex-1 overflow-y-auto p-3">
        {NAV.map((group) => (
          <div key={group.section} className="mb-4">
            <div className="mb-1.5 px-2 text-[10px] font-medium uppercase tracking-wider text-muted-foreground/70">
              {group.section}
            </div>
            <div className="space-y-0.5">
              {group.items
                .filter((item) => !item.adminOnly || user.role === "ADMIN")
                .map((item) => {
                  const active = pathname === item.href || pathname.startsWith(item.href + "/");
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className={cn(
                        "flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[13px] transition-colors",
                        active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                      )}
                    >
                      <item.icon className="h-3.5 w-3.5" />
                      {item.label}
                      {item.href === "/reviews" ? <PendingReviewsDot /> : null}
                    </Link>
                  );
                })}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-border p-3">
        <div className="flex items-center gap-2.5 rounded-md px-2 py-1.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-muted text-[10px] font-semibold">
            {initials(user.name)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-xs font-medium">{user.name}</div>
            <div className="truncate text-[10px] text-muted-foreground">{user.email}</div>
          </div>
          <Badge tone={user.role === "ADMIN" ? "info" : user.role === "ANALYST" ? "success" : "outline"} className="text-[9px]">
            {user.role}
          </Badge>
        </div>
        <Button variant="ghost" size="sm" className="mt-1 w-full justify-start" onClick={logout}>
          <LogOut className="h-3.5 w-3.5" /> Sign out
        </Button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen">
      {/* desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 border-r border-border bg-card/40 backdrop-blur-xl lg:block">
        {sidebar}
      </aside>

      {/* mobile top bar + drawer */}
      <div className="fixed inset-x-0 top-0 z-40 flex h-14 items-center justify-between border-b border-border bg-background/80 px-4 backdrop-blur-xl lg:hidden">
        <button onClick={() => setOpen(true)} className="rounded-md p-1.5 hover:bg-muted">
          <Menu className="h-5 w-5" />
        </button>
        <span className="text-sm font-semibold">DataForge AI</span>
        <div className="w-9" />
      </div>
      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden" onClick={() => setOpen(false)}>
          <div className="absolute inset-0 bg-background/70 backdrop-blur-sm" />
          <aside className="absolute inset-y-0 left-0 w-64 border-r border-border bg-card" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setOpen(false)} className="absolute right-3 top-4 rounded p-1 hover:bg-muted">
              <X className="h-4 w-4" />
            </button>
            {sidebar}
          </aside>
        </div>
      ) : null}

      <main className="min-h-screen flex-1 pt-14 lg:pl-60 lg:pt-0">{children}</main>
    </div>
  );
}

function PendingReviewsDot() {
  // Lightweight: hidden until reviews page loads real count via SWR-like polling
  return (
    <span className="ml-auto hidden h-1.5 w-1.5 rounded-full bg-warning lg:block" title="Pending reviews" />
  );
}
