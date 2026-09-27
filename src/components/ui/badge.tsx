import { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type Tone = "default" | "success" | "warning" | "danger" | "info" | "demo" | "ai" | "outline";

const tones: Record<Tone, string> = {
  default: "bg-muted text-muted-foreground border-border",
  success: "bg-success/10 text-success border-success/25",
  warning: "bg-warning/10 text-warning border-warning/25",
  danger: "bg-danger/10 text-danger border-danger/25",
  info: "bg-primary/10 text-primary border-primary/25",
  demo: "bg-accent/10 text-accent border-accent/25",
  ai: "bg-violet-500/10 text-violet-300 border-violet-500/25",
  outline: "bg-transparent text-muted-foreground border-border",
};

export function Badge({ tone = "default", className, ...props }: HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 whitespace-nowrap rounded-full border px-2 py-0.5 text-[11px] font-medium leading-4",
        tones[tone],
        className
      )}
      {...props}
    />
  );
}

export function StatusDot({ status }: { status: string }) {
  const map: Record<string, string> = {
    COMPLETED: "bg-success",
    ACTIVE: "bg-success",
    AVAILABLE: "bg-success",
    RUNNING: "bg-primary animate-pulse-dot",
    QUEUED: "bg-warning",
    PENDING: "bg-warning",
    DEGRADED: "bg-warning",
    FAILED: "bg-danger",
    CANCELLED: "bg-muted-foreground",
    UNAVAILABLE: "bg-danger",
    FLAGGED: "bg-warning",
  };
  return <span className={cn("inline-block h-1.5 w-1.5 rounded-full", map[status] ?? "bg-muted-foreground")} />;
}
