export interface AuditLog {
  id: string;
  timestamp: string;
  username: string;
  action: string;
  details: string;
  ipAddress: string;
  severity: "info" | "warning" | "danger" | "success";
}

const STORAGE_KEY = "kopdes_audit_logs";

const defaultLogs: AuditLog[] = [
  {
    id: "log-1",
    timestamp: "28 Mei 2026 02:05",
    username: "Admin Kedungsana",
    action: "SHU_SIMULATION",
    details: "Melakukan simulasi penyesuaian alokasi persentase pembagian SHU AD/ART: Jasa Modal diset ke 33.32% dan Jasa Transaksi diset ke 6.68%.",
    ipAddress: "192.168.1.102",
    severity: "success"
  },
  {
    id: "log-2",
    timestamp: "28 Mei 2026 01:50",
    username: "Admin Kedungsana",
    action: "EXPORT_EXCEL",
    details: "Mengekspor Laporan Distribusi SHU Koperasi format RAT 2024 ke berkas Excel (.xls).",
    ipAddress: "192.168.1.102",
    severity: "info"
  },
  {
    id: "log-3",
    timestamp: "27 Mei 2026 18:40",
    username: "Admin Kedungsana",
    action: "EDIT_MEMBER",
    details: "Mengupdate profil KTP dan verifikasi data lengkap anggota: m2 (NENI MULYANI).",
    ipAddress: "192.168.1.102",
    severity: "info"
  },
  {
    id: "log-4",
    timestamp: "27 Mei 2026 15:12",
    username: "Admin Kedungsana",
    action: "SPREADSHEET_EDIT",
    details: "Mengubah data simpanan sukarela m1 (OMAN NUROHMAN) menjadi Rp 169.000 via Spreadsheet Live Editor.",
    ipAddress: "192.168.1.102",
    severity: "info"
  },
  {
    id: "log-5",
    timestamp: "26 Mei 2026 09:30",
    username: "Sistem Otomatis",
    action: "OCR_SCAN",
    details: "Berhasil mengekstrak data identitas KTP secara otomatis untuk anggota m14 (TATI HARYATI).",
    ipAddress: "127.0.0.1",
    severity: "success"
  },
  {
    id: "log-6",
    timestamp: "25 Mei 2026 10:00",
    username: "Admin Kedungsana",
    action: "IMPORT_SEED",
    details: "Berhasil mengimpor data awal 20 Anggota Terdaftar beserta saldo Simpanan Pokok, Wajib, dan Sukarela ke dalam database in-memory.",
    ipAddress: "192.168.1.102",
    severity: "success"
  },
  {
    id: "log-7",
    timestamp: "25 Mei 2026 09:45",
    username: "Admin Kedungsana",
    action: "LOGIN",
    details: "Admin Kedungsana berhasil melakukan otentikasi login ke panel administrator utama.",
    ipAddress: "192.168.1.102",
    severity: "info"
  },
  {
    id: "log-8",
    timestamp: "24 Mei 2026 14:20",
    username: "Dewan Pengawas",
    action: "AUDIT_START",
    details: "Memulai audit kepatuhan tahunan pra-RAT untuk memvalidasi keselarasan saldo kas fisik dengan laporan digital.",
    ipAddress: "192.168.1.200",
    severity: "warning"
  }
];

export const getAuditLogs = (): AuditLog[] => {
  if (typeof window === "undefined") return defaultLogs;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultLogs));
      return defaultLogs;
    }
    return JSON.parse(stored);
  } catch (error) {
    console.error("Failed to load audit logs", error);
    return defaultLogs;
  }
};

export const addAuditLog = (
  action: string,
  details: string,
  severity: "info" | "warning" | "danger" | "success" = "info",
  username: string = "Admin Kedungsana"
): void => {
  if (typeof window === "undefined") return;
  try {
    const logs = getAuditLogs();
    
    // Format timestamp: "28 Mei 2026 02:16"
    const now = new Date();
    const months = [
      "Januari", "Februari", "Maret", "April", "Mei", "Juni",
      "Juli", "Agustus", "September", "Oktober", "November", "Desember"
    ];
    const pad = (n: number) => n.toString().padStart(2, "0");
    const timestamp = `${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
    
    const newLog: AuditLog = {
      id: `log-${Date.now()}`,
      timestamp,
      username,
      action,
      details,
      ipAddress: "192.168.1.102", // Mocked active network IP
      severity
    };
    
    const updated = [newLog, ...logs];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated.slice(0, 200))); // Cap at 200 items
  } catch (error) {
    console.error("Failed to add audit log", error);
  }
};

export const clearAuditLogs = (): void => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
  } catch (error) {
    console.error("Failed to clear audit logs", error);
  }
};
