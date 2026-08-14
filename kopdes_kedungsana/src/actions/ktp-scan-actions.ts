"use server";

export type KtpScanResult = {
  nik?: string;
  name?: string;
  birthPlace?: string;
  birthDate?: string;
  gender?: string;
  address?: string;
  bloodType?: string;
  religion?: string;
  maritalStatus?: string;
  occupation?: string;
};

const EXTRACTION_PROMPT =
  "Anda adalah sistem ahli ekstraksi data KTP Indonesia. Ekstrak data dari gambar KTP ini ke dalam format JSON. " +
  "Kunci JSON harus persis: 'nik', 'name', 'birthPlace', 'birthDate' (format YYYY-MM-DD), 'gender' (hanya " +
  "'laki-laki' atau 'perempuan'), 'address' (gabungkan jalan, RT/RW, kel/desa, dan kecamatan menjadi satu string " +
  "dengan koma), 'bloodType' (hanya 'A', 'B', 'AB', 'O', atau '-'), 'religion' (hanya 'Islam', 'Kristen', " +
  "'Katolik', 'Hindu', 'Buddha', 'Khonghucu'), 'maritalStatus' (hanya 'Belum Kawin', 'Kawin', 'Cerai Hidup', " +
  "'Cerai Mati'), 'occupation'. Hanya kembalikan output JSON tanpa format markdown.";

export async function scanKtpImage(base64Data: string): Promise<KtpScanResult> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("Gemini API Key tidak ditemukan di server!");
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: EXTRACTION_PROMPT },
              { inlineData: { mimeType: "image/jpeg", data: base64Data } },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.1,
          responseMimeType: "application/json",
        },
      }),
    },
  );

  const responseData = await response.json();

  if (!response.ok) {
    throw new Error(responseData.error?.message || "Gagal menghubungi Gemini API");
  }

  const rawText = responseData.candidates[0].content.parts[0].text;
  return JSON.parse(rawText);
}
