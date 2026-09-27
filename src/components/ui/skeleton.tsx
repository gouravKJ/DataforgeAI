import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-md bg-muted/70", className)} />;
}

export function Spinner({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-block h-4 w-4 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-primary",
        className
      )}
    />
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border px-6 py-14 text-center">
      {icon ? <div className="text-muted-foreground/60">{icon}</div> : null}
      <div>
        <p className="text-sm font-medium">{title}</p>
        {description ? <p className="mt-1 max-w-md text-xs text-muted-foreground">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}
