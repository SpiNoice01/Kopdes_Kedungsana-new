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

export const addAuditLog = async (
  action: string,
  details: string,
  severity: "info" | "warning" | "danger" | "success" = "info",
  username = "Admin Kopdes Kedungsana"
): Promise<void> => {
  try {
    const { error } = await supabase.from("audit_logs").insert({
      action,
      details,
      severity,
      username,
      ip_address: "192.168.1.102"
    });

    if (error) {
      console.error("Failed to insert audit log", error);
    }
  } catch (error) {
    console.error("Exception adding audit log", error);
  }
};

export const clearAuditLogs = async (): Promise<void> => {
  console.warn("Audit logs are immutable and cannot be cleared by the client.");
};
