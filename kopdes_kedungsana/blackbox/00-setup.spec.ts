import fs from "node:fs";
import path from "node:path";
import { test } from "@playwright/test";
import { EVIDENCE_DIR, FIXTURE_DIR, RESULTS_FILE, STATE_FILE, saveState } from "./helpers";

// Menyiapkan run baru: membersihkan hasil run sebelumnya, membuat berkas uji
// (foto valid, berkas >2MB/>4MB, berkas bukan gambar) dan menentukan NIK dummy.
test("setup run", async ({ page }) => {
  for (const file of fs.readdirSync(EVIDENCE_DIR)) {
    if (file.endsWith(".png") || file.endsWith(".jsonl")) fs.rmSync(path.join(EVIDENCE_DIR, file));
  }
  if (fs.existsSync(RESULTS_FILE)) fs.rmSync(RESULTS_FILE);
  if (fs.existsSync(STATE_FILE)) fs.rmSync(STATE_FILE);

  const now = new Date();
  const runId = [now.getMonth() + 1, now.getDate(), now.getHours(), now.getMinutes()]
    .map((n) => String(n).padStart(2, "0"))
    .join("");
  const nik = (seq: number) => `9999${runId}${String(seq).padStart(4, "0")}`;

  saveState({
    runId,
    members: {
      A: { name: "UJI BLACKBOX A", nik: nik(1) },
      B: { name: "UJI BLACKBOX B", nik: nik(2) },
      C: { name: "UJI BLACKBOX C", nik: nik(3) },
    },
    loginAttempts: [],
    downloads: {},
  });

  // Foto valid (PNG asli) digambar di canvas lalu di-screenshot.
  await page.setContent(`
    <canvas id="c" width="300" height="400"></canvas>
    <script>
      const ctx = document.getElementById('c').getContext('2d');
      ctx.fillStyle = '#cfe3d4'; ctx.fillRect(0,0,300,400);
      ctx.fillStyle = '#1f6f43'; ctx.beginPath(); ctx.arc(150,150,80,0,Math.PI*2); ctx.fill();
      ctx.fillRect(60,260,180,120);
      ctx.fillStyle = '#000'; ctx.font = 'bold 22px sans-serif'; ctx.fillText('FOTO UJI', 95, 40);
    </script>`);
  await page.locator("#c").screenshot({ path: path.join(FIXTURE_DIR, "foto-uji.png") });
  await page.setContent(`<canvas id="c" width="300" height="400"></canvas>
    <script>const x=document.getElementById('c').getContext('2d');x.fillStyle='#e8d9b5';x.fillRect(0,0,300,400);
    x.fillStyle='#000';x.font='bold 20px sans-serif';x.fillText('BUKTI POKOK UJI',60,200);</script>`);
  await page.locator("#c").screenshot({ path: path.join(FIXTURE_DIR, "bukti-pokok-uji.png") });

  fs.writeFileSync(path.join(FIXTURE_DIR, "foto-3mb.png"), Buffer.alloc(3 * 1024 * 1024, 7));
  fs.writeFileSync(path.join(FIXTURE_DIR, "ktp-5mb.jpg"), Buffer.alloc(5 * 1024 * 1024, 7));
  fs.writeFileSync(path.join(FIXTURE_DIR, "dokumen.txt"), "ini bukan gambar");
});
