"use server";

export async function scanKtpImage(base64Data: string): Promise<string> {
  const apiKey = process.env.OCR_SPACE_API_KEY;

  if (!apiKey) {
    throw new Error("OCR_SPACE_API_KEY tidak ditemukan di server!");
  }

  const formData = new FormData();
  formData.append("apikey", apiKey);
  formData.append("base64Image", `data:image/jpeg;base64,${base64Data}`);
  formData.append("language", "eng");
  formData.append("OCREngine", "2");
  formData.append("scale", "true");
  formData.append("isOverlayRequired", "false");

  const response = await fetch("https://api.ocr.space/parse/image", {
    method: "POST",
    body: formData,
  });

  const responseData = await response.json();

  if (!response.ok || responseData.IsErroredOnProcessing) {
    const message = Array.isArray(responseData.ErrorMessage)
      ? responseData.ErrorMessage.join(", ")
      : responseData.ErrorMessage || "Gagal menghubungi OCR.space API";
    throw new Error(message);
  }

  const parsedText = responseData.ParsedResults?.[0]?.ParsedText;
  if (!parsedText) {
    throw new Error("OCR.space tidak berhasil mengekstrak teks dari gambar");
  }

  return parsedText;
}
