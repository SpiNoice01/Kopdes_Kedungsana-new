"use server";

import { headers } from "next/headers";
import { createAdminClient } from "@/src/utils/supabase-admin";
import { SupabaseMemberRepository } from "@/src/features/member/infrastructure/supabase-member-repository";
import type { Member, PublicMemberProfile } from "@/src/features/member/domain/member";
import type { MemberMonthlySaving } from "@/src/features/member/domain/member-monthly-saving";
import type { MemberInvestment } from "@/src/features/member/domain/member-investment";

const RATE_LIMIT_MAX_ATTEMPTS = 5;
const RATE_LIMIT_WINDOW_MINUTES = 5;
const NIK_PATTERN = /^\d{16}$/;

const readImageSize = (dataUrl: string): { width: number; height: number } | null => {
  const match = dataUrl.match(/^data:(image\/(?:jpeg|png));base64,/);
  if (!match) return null;
  // The size sits near the start of both formats (after EXIF for camera
  // JPEGs, which can be up to 64 KB), so ~192 KB of the file is enough.
  const bytes = Buffer.from(dataUrl.slice(match[0].length, match[0].length + 262_144), "base64");

  if (match[1] === "image/png") {
    return bytes.length >= 24 ? { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) } : null;
  }

  // JPEG: walk the segments until the first SOF marker, which holds the size.
  let offset = 2;
  while (offset + 9 < bytes.length) {
    if (bytes[offset] !== 0xff) return null;
    const marker = bytes[offset + 1];
    if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
      return { height: bytes.readUInt16BE(offset + 5), width: bytes.readUInt16BE(offset + 7) };
    }
    offset += 2 + bytes.readUInt16BE(offset + 2);
  }
  return null;
};

/**
 * The member photo is cropped from the KTP scan (member-panel.tsx), which
 * gives a portrait face shot; if that crop fails the whole landscape KTP
 * image is stored instead. Only pass portrait photos to the public portal so
 * a full KTP never reaches the browser; anything else shows the initial
 * placeholder MemberProfileCard already uses for members without a photo.
 */
const portraitPhotoOnly = (photoUrl: string | null): string | null => {
  if (!photoUrl) return null;
  const size = readImageSize(photoUrl);
  return size && size.height >= size.width ? photoUrl : null;
};

const toPublicProfile = (member: Member): PublicMemberProfile => ({
  nik: member.nik,
  name: member.name,
  photoUrl: portraitPhotoOnly(member.photoUrl),
  address: member.address,
  joinDate: member.joinDate,
  status: member.status,
});

const resolveClientIp = async (): Promise<string> => {
  const headersList = await headers();
  const forwardedFor = headersList.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }
  return headersList.get("x-real-ip") || "Unknown IP";
};

export type NikSearchResult =
  | {
      status: "found";
      member: PublicMemberProfile;
      savings: MemberMonthlySaving[];
      investments: MemberInvestment[];
    }
  | { status: "not_found" }
  | { status: "rate_limited" };

/**
 * Public, unauthenticated NIK lookup for the Cek Simpanan portal
 * (app/cek-simpanan) — runs server-side specifically so the client never
 * has to fetch (and can never brute-force via network inspection) more than
 * one member's data per request. Rate-limited per IP via nik_search_attempts
 * (see database/migrations/0001_schema.sql) to slow down automated NIK-guessing,
 * since Indonesian NIK has a guessable structure (fixed region code + birth
 * date + a 4-digit sequence) for anyone targeting one specific village's
 * membership. The member's savings and investments come back in the same
 * call because the anon key can no longer read those tables from the browser
 * (see database/migrations/0002_security.sql). Only the fields the portal displays are
 * returned (see PublicMemberProfile).
 */
export async function searchMemberByNik(nik: string): Promise<NikSearchResult> {
  const ip = await resolveClientIp();
  const supabase = createAdminClient();

  const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW_MINUTES * 60 * 1000).toISOString();
  const { count, error: countError } = await supabase
    .from("nik_search_attempts")
    .select("id", { count: "exact", head: true })
    .eq("ip_address", ip)
    .gte("created_at", windowStart);

  if (countError) {
    // Fail open on the rate-limit check itself (a transient DB hiccup
    // shouldn't lock legitimate members out) — the search below is still a
    // single filtered row, not a bulk fetch, so the worst case here is
    // degraded throttling, not a data exposure.
    console.error("Gagal memeriksa rate limit pencarian NIK", countError);
  } else if ((count ?? 0) >= RATE_LIMIT_MAX_ATTEMPTS) {
    return { status: "rate_limited" };
  }

  await supabase.from("nik_search_attempts").insert({ ip_address: ip });

  // Server Actions can be called directly, bypassing the portal's input
  // checks. Anything but an exact 16-digit NIK is answered like an unknown
  // NIK, after the attempt is counted, so the portal behaves as before.
  if (typeof nik !== "string" || !NIK_PATTERN.test(nik)) {
    return { status: "not_found" };
  }

  const memberRepository = new SupabaseMemberRepository(supabase);
  const member = await memberRepository.findByNik(nik);

  if (!member) {
    return { status: "not_found" };
  }

  const [savings, investments] = await Promise.all([
    memberRepository.getMonthlySavingsByMemberId(member.id),
    memberRepository.getInvestmentsByMemberId(member.id),
  ]);

  return { status: "found", member: toPublicProfile(member), savings, investments };
}
