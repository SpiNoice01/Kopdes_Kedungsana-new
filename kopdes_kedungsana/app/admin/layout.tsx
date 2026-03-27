import { ReactNode } from "react";
import { AdminShell } from "@/src/features/admin/presentation/admin-shell";

type AdminLayoutProps = {
  children: ReactNode;
};

export default function AdminLayout({ children }: AdminLayoutProps) {
  return <AdminShell>{children}</AdminShell>;
}
