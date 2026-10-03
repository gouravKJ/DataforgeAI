import Link from "next/link";
import { Boxes } from "lucide-react";

export function AuthShell({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen items-center justify-center bg-[#F8F8F5] px-4 py-12 text-[#1D1D1B] selection:bg-[#6E40FF] selection:text-white">
      <div className="grid-bg absolute inset-0 opacity-40 pointer-events-none" />

      <div className="relative z-10 w-full max-w-md">
        {/* BRAND & HEADER */}
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <Link href="/" className="flex items-center gap-3 transition-transform hover:scale-105">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#1D1D1B] text-white shadow-md">
              <Boxes className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-extrabold tracking-tight text-[#1D1D1B]">DataForge AI</span>
          </Link>
          <span className="font-mono text-[10px] font-extrabold px-3 py-1 rounded-full bg-[#9794F7] text-[#1D1D1B] border border-[#1D1D1B]/20">
            HACKATHON BUILD
          </span>

          <h1 className="mt-4 text-2xl font-extrabold tracking-tight text-[#1D1D1B]">{title}</h1>
          <p className="text-xs text-[#1D1D1B]/70 font-medium max-w-xs">{subtitle}</p>
        </div>

        {/* MOTA CARD CONTAINER */}
        <div className="rounded-3xl border-2 border-[#1D1D1B] bg-white p-7 shadow-2xl">
          {children}
        </div>
      </div>
    </div>
  );
}
