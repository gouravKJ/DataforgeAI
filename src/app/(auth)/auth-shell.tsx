import Link from "next/link";
import { Boxes } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function AuthShell({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen items-center justify-center px-4 py-10">
      <div className="grid-bg absolute inset-0" />
      <div className="relative w-full max-w-md">
        <div className="mb-8 flex flex-col items-center gap-2 text-center">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15">
              <Boxes className="h-5 w-5 text-primary" />
            </div>
            <span className="text-base font-semibold tracking-tight">DataForge AI</span>
          </Link>
          <h1 className="mt-3 text-xl font-semibold tracking-tight">{title}</h1>
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        </div>
        <div className="glass rounded-xl p-6">{children}</div>
      </div>
    </div>
  );
}
