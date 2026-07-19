"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { authDependencies } from "../infrastructure/auth-dependencies";
import { setAuthCookie } from "@/src/actions/auth-actions";

type LoginState = {
  message: string;
  isError: boolean;
};

const initialState: LoginState = {
  message: "",
  isError: false,
};

export function LoginForm() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [loginState, setLoginState] = useState<LoginState>(initialState);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setLoginState(initialState);

    const result = await authDependencies.loginUseCase.execute({
      identifier,
      password,
    });

    if (!result.success) {
      setLoginState({ message: result.message, isError: true });
      setIsLoading(false);
      return;
    }

    setLoginState({
      message: `Login berhasil. Selamat datang, ${result.user.name}.`,
      isError: false,
    });
    await setAuthCookie();
    router.push("/admin/overview");
    setIsLoading(false);
  };

  return (
    <div className="w-full max-w-md rounded-2xl border border-primary/25 bg-background p-6">
      <h1 className="text-2xl font-semibold text-primary">Masuk Admin</h1>
      <p className="mt-2 text-sm text-foreground/70">
        Gunakan email atau nomor telepon dan kata sandi.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div className="space-y-2">
          <label
            htmlFor="identifier"
            className="text-sm font-medium text-foreground"
          >
            Email atau Nomor Telepon
          </label>
          <input
            id="identifier"
            type="text"
            value={identifier}
            onChange={(event) => setIdentifier(event.target.value)}
            placeholder="admin@kopdeskedungsana.id / 081234567890"
            className="w-full rounded-xl border border-foreground/20 bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
            autoComplete="username"
          />
        </div>

        <div className="space-y-2">
          <label
            htmlFor="password"
            className="text-sm font-medium text-foreground"
          >
            Kata Sandi
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Masukkan kata sandi"
            className="w-full rounded-xl border border-foreground/20 bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
            autoComplete="current-password"
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full rounded-xl bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:opacity-95 disabled:opacity-60"
        >
          {isLoading ? "Memproses..." : "Masuk"}
        </button>
      </form>

      {loginState.message ? (
        <p className="mt-4 text-sm text-foreground">
          {loginState.isError
            ? `Gagal: ${loginState.message}`
            : loginState.message}
        </p>
      ) : null}

      <div className="mt-6 rounded-xl border border-blue-200 bg-blue-50 p-3 text-xs text-blue-800">
        <p className="font-semibold mb-1">Akses Terbatas</p>
        <p>Sistem ini telah terintegrasi dengan <strong>Supabase Auth</strong>. Silakan hubungi Administrator Utama jika Anda belum memiliki akun atau lupa kata sandi.</p>
      </div>
    </div>
  );
}
