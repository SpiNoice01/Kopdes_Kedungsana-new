export interface AuditLog {
  id: string;
  timestamp: string;
  username: string;
  action: string;
  details: string;
  ipAddress: string;
  severity: "info" | "warning" | "danger" | "success";
}

import { supabase } from "./supabase-client";
import { recordAuditLog } from "@/src/actions/audit-log-actions";

export const getAuditLogs = async (): Promise<AuditLog[]> => {
  try {
    const { data, error } = await supabase
      .from("audit_logs")
      .select("*")
      .order("timestamp", { ascending: false })
      .limit(200);

    if (error || !data) {
      console.error("Supabase Error:", error);
      return [];
    }

    return data.map((row: any) => ({
      id: row.id,
      timestamp: new Date(row.timestamp).toLocaleString("id-ID", {
        day: "numeric", month: "long", year: "numeric", 
        hour: "2-digit", minute: "2-digit"
      }),
      username: row.username,
      action: row.action,
      details: row.details,
      ipAddress: row.ip_address || "Unknown IP",
      severity: row.severity
    }));
  } catch (err) {
    console.error("Failed to fetch audit logs", err);
    return [];
  }
};

// Fallback for the rare case there's genuinely no active session when this
// fires — every real call site runs inside the authenticated admin area, so
// this should be unreachable in practice, not a routine identity.
const FALLBACK_IDENTITY = "Admin Kopdes Kedungsana (sesi tidak diketahui)";

/**
 * `username` is an optional override — leave it unset (as almost every call
 * site does) and the real logged-in admin's identity (email/phone/id from
 * the live Supabase session) is used automatically. Previously this always
 * fell back to a hardcoded generic string unless the caller explicitly
 * passed a username, which none did except the backup feature — meaning
 * every other action (add member, record savings, print documents, export,
 * navigation, ...) was logged under the same name no matter who was
 * actually logged in, defeating the individual-accountability role the
 * audit trail is documented to play (SRS 5.5, SCRAM 5.3).
 */
export const addAuditLog = async (
  action: string,
  details: string,
  severity: "info" | "warning" | "danger" | "success" = "info",
  username?: string
): Promise<void> => {
  try {
    const { data } = await supabase.auth.getSession();
    const identity =
      username ?? data.session?.user?.email ?? data.session?.user?.phone ?? data.session?.user?.id ?? FALLBACK_IDENTITY;
    await recordAuditLog(action, details, severity, identity, data.session?.access_token);
  } catch (error) {
    console.error("Exception adding audit log", error);
  }
};

export const clearAuditLogs = async (): Promise<void> => {
  console.warn("Audit logs are immutable and cannot be cleared by the client.");
};
