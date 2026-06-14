import { LoginForm } from "@/src/features/auth/presentation/login-form";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10 font-sans">
      <main className="w-full max-w-md">
        <LoginForm />
      </main>
    </div>
  );
}
