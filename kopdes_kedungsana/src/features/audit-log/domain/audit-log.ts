export type AuditSeverity = "info" | "warning" | "danger" | "success";

export interface AuditLog {
  id: string;
  timestamp: string;
  username: string;
  action: string;
  details: string;
  ipAddress: string;
  severity: AuditSeverity;
}
