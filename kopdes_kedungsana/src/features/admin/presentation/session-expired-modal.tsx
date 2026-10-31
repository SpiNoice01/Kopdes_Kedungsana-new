"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../utils/supabase-client";
import { clearAuthCookie } from "@/src/actions/auth-actions";

// Pages that hit an RLS rejection (Postgres 42501) dispatch this so the shell
// can block the admin panel, since a rejected write means the token is dead.
export const SESSION_EXPIRED_EVENT = "kopdes:session-expired";

export const notifySessionExpired = () => {
  window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
};

type SessionExpiredModalProps = {
  isOpen: boolean;
};

export function SessionExpiredModal({ isOpen }: SessionExpiredModalProps) {
  const router = useRouter();
  const [isRedirecting, setIsRedirecting] = useState(false);

  if (!isOpen) return null;

  const handleRelogin = async () => {
    setIsRedirecting(true);
    try {
      // Drop the stale local session too, so the login page starts clean.
      await supabase.auth.signOut({ scope: "local" });
      await clearAuthCookie();
    } catch (error) {
      console.error("Gagal membersihkan sesi lama", error);
    } finally {
      router.push("/login");
    }
  };

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="session-expired-title"
      className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-[110] flex items-center justify-center p-4 print:hidden"
    >
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600">
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>

        <h2 id="session-expired-title" className="mt-4 text-lg font-semibold text-slate-900">
          Sesi Login Berakhir
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          Sesi login Anda sudah tidak berlaku. Selama belum login ulang, data
          tidak dapat dimuat maupun disimpan dengan benar, sehingga angka yang
          tampil di admin panel belum dapat dipercaya. Silakan login ulang
          untuk melanjutkan.
        </p>

        <button
          type="button"
          onClick={handleRelogin}
          disabled={isRedirecting}
          className="mt-5 w-full rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-95 disabled:opacity-60"
        >
          {isRedirecting ? "Mengalihkan..." : "Login Ulang"}
        </button>
      </div>
    </div>
  );
}
