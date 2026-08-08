"use server";

import { headers } from "next/headers";
import { createClient } from "@supabase/supabase-js";

export type AuditSeverity = "info" | "warning" | "danger" | "success";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

const resolveClientIp = async (): Promise<string> => {
  const headersList = await headers();
  const forwardedFor = headersList.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }
  return headersList.get("x-real-ip") || "Unknown IP";
};

export async function recordAuditLog(
  action: string,
  details: string,
  severity: AuditSeverity = "info",
  username = "Admin Kopdes Kedungsana",
  accessToken?: string,
): Promise<void> {
  const ipAddress = await resolveClientIp();

  // A Server Action runs in its own request context and does not share the
  // browser's persisted Supabase session, so we forward the caller's access
  // token here to authenticate this insert as the same logged-in admin
  // (required by the audit_logs RLS policy, which only allows the
  // "authenticated" role).
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: accessToken
      ? { headers: { Authorization: `Bearer ${accessToken}` } }
      : undefined,
  });

  const { error } = await supabase.from("audit_logs").insert({
    action,
    details,
    severity,
    username,
    ip_address: ipAddress,
  });

  if (error) {
    console.error("Failed to insert audit log", error);
  }
}
