import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { SettingsClient } from "./settings-client";

export const metadata = { title: "Settings — DataForge AI" };

export default async function SettingsPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  return <SettingsClient user={{ name: user.name, email: user.email, role: user.role, orgName: user.org.name }} />;
}
