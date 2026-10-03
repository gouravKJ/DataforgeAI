"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Boxes, LayoutDashboard, Wand2, Workflow, Database, Plug, Search, Sparkles,
  Gauge, ClipboardCheck, History, Settings, Shield, LogOut, Menu, X,
} from "lucide-react";
import { useState } from "react";
import { cn, initials } from "@/lib/utils";
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
    <div className="flex h-full flex-col bg-white text-[#1D1D1B] select-none">
      {/* BRAND LOGO HEADER */}
      <div className="flex h-16 items-center gap-3 border-b border-[#1D1D1B]/15 px-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#1D1D1B] text-white shadow-sm">
          <Boxes className="h-5 w-5 text-white" />
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-extrabold tracking-tight text-[#1D1D1B]">DataForge AI</span>
          <span className="font-mono text-[9px] font-extrabold text-[#6E40FF] uppercase tracking-wider">
            INTELLIGENCE OS
          </span>
        </div>
      </div>

      {/* ORGANIZATION BANNER */}
      <div className="border-b border-[#1D1D1B]/15 bg-[#F8F8F5] px-5 py-3.5">
        <div className="font-mono text-[10px] font-extrabold uppercase tracking-widest text-[#1D1D1B]/50">
          ORGANIZATION
        </div>
        <div className="mt-1 flex items-center justify-between">
          <span className="truncate text-xs font-bold text-[#1D1D1B]">{user.org.name}</span>
          <span className="font-mono text-[9px] font-extrabold bg-[#F7CE78] text-[#1D1D1B] border border-[#1D1D1B]/20 px-2 py-0.5 rounded-full">
            LIVE
          </span>
        </div>
      </div>

      {/* NAV LINKS */}
      <nav className="flex-1 overflow-y-auto p-3.5">
        {NAV.map((group) => (
          <div key={group.section} className="mb-5">
            <div className="mb-2 px-2.5 font-mono text-[10px] font-extrabold uppercase tracking-widest text-[#1D1D1B]/60">
              {group.section}
            </div>
            <div className="space-y-1">
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
                        "flex items-center gap-3 rounded-xl px-3 py-2 text-xs font-bold transition-all",
                        active
                          ? "bg-[#9794F7]/20 text-[#6E40FF] border-r-4 border-[#6E40FF] shadow-xs"
                          : "text-[#1D1D1B]/70 hover:bg-[#F8F8F5] hover:text-[#1D1D1B]"
                      )}
                    >
                      <item.icon className={cn("h-4 w-4 stroke-[2.2]", active ? "text-[#6E40FF]" : "text-[#1D1D1B]/60")} />
                      {item.label}
                      {item.href === "/reviews" ? <PendingReviewsDot /> : null}
                    </Link>
                  );
                })}
            </div>
          </div>
        ))}
      </nav>

      {/* USER PROFILE FOOTER */}
      <div className="border-t border-[#1D1D1B]/15 bg-[#F8F8F5] p-3.5">
        <div className="flex items-center gap-3 rounded-xl bg-white border border-[#1D1D1B]/15 p-2.5 shadow-xs">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1D1D1B] text-white text-xs font-extrabold shadow-sm">
            {initials(user.name)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-xs font-extrabold text-[#1D1D1B]">{user.name}</div>
            <div className="truncate text-[10px] text-[#1D1D1B]/60 font-medium">{user.email}</div>
          </div>
          <span
            className={cn(
              "font-mono text-[9px] font-extrabold px-2 py-0.5 rounded-full border border-[#1D1D1B]/20 shrink-0",
              user.role === "ADMIN"
                ? "bg-[#9794F7] text-[#1D1D1B]"
                : user.role === "ANALYST"
                ? "bg-[#A1E0DE] text-[#1D1D1B]"
                : "bg-[#F7CE78] text-[#1D1D1B]"
            )}
          >
            {user.role}
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="mt-2 w-full justify-start text-xs font-bold text-[#1D1D1B]/70 hover:bg-[#1D1D1B]/5 hover:text-[#1D1D1B] rounded-xl"
          onClick={logout}
        >
          <LogOut className="h-3.5 w-3.5" /> Sign out
        </Button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-[#F8F8F5] text-[#1D1D1B] font-sans selection:bg-[#6E40FF] selection:text-white">
      {/* DESKTOP SIDEBAR */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-[#1D1D1B]/15 bg-white shadow-sm lg:block">
        {sidebar}
      </aside>

      {/* MOBILE TOP BAR + DRAWER */}
      <div className="fixed inset-x-0 top-0 z-40 flex h-14 items-center justify-between border-b border-[#1D1D1B]/15 bg-[#F8F8F5]/90 px-4 backdrop-blur-xl lg:hidden">
        <button onClick={() => setOpen(true)} className="rounded-xl p-1.5 hover:bg-[#1D1D1B]/5 text-[#1D1D1B]">
          <Menu className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-2 font-bold text-[#1D1D1B]">
          <Boxes className="h-5 w-5 text-[#6E40FF]" /> DataForge AI
        </div>
        <div className="w-9" />
      </div>

      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden" onClick={() => setOpen(false)}>
          <div className="absolute inset-0 bg-[#1D1D1B]/40 backdrop-blur-sm" />
          <aside className="absolute inset-y-0 left-0 w-64 border-r border-[#1D1D1B]/15 bg-white" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setOpen(false)} className="absolute right-3 top-4 rounded-xl p-1 hover:bg-[#1D1D1B]/5 text-[#1D1D1B]">
              <X className="h-4 w-4" />
            </button>
            {sidebar}
          </aside>
        </div>
      ) : null}

      <main className="min-h-screen flex-1 pt-14 lg:pl-64 lg:pt-0 bg-[#F8F8F5] text-[#1D1D1B]">{children}</main>
    </div>
  );
}

function PendingReviewsDot() {
  return (
    <span className="ml-auto hidden h-2 w-2 rounded-full bg-[#F7CE78] border border-[#1D1D1B]/20 lg:block" title="Pending reviews" />
  );
}
