import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { AppShellClient } from "@/components/app/app-shell";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (!user.org.onboarded) redirect("/onboarding");

  return <AppShellClient user={user}>{children}</AppShellClient>;
}
