import { Suspense } from "react";
import { LoginForm } from "./login-form";
import { AuthShell } from "../auth-shell";

export default function LoginPage() {
  return (
    <AuthShell
      title="Sign in to DataForge"
      subtitle="Describe the Data. We Build the Intelligence."
    >
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </AuthShell>
  );
}
