"use server";

import { headers } from "next/headers";
import { supabase } from "@/src/utils/supabase-client";

export type AuditSeverity = "info" | "warning" | "danger" | "success";

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
): Promise<void> {
  const ipAddress = await resolveClientIp();

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
