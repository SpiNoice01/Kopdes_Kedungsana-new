// Tanggal kalender koperasi selalu mengikuti WIB, bukan UTC dan bukan zona
// waktu mesin. toISOString() memberi tanggal UTC, jadi pukul 00:00-06:59 WIB
// masih tercatat sebagai hari kemarin; zona waktu lokal juga tidak bisa
// diandalkan karena kode ini ikut berjalan di server Render (UTC).
const KOPDES_TIME_ZONE = "Asia/Jakarta";

// "YYYY-MM-DD" menurut WIB.
export const todayLocalDateString = (date: Date = new Date()): string =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: KOPDES_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
