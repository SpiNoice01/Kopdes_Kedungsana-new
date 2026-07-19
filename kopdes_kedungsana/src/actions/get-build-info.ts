"use server";

import { execSync } from "child_process";

export async function getLastCommitDate(): Promise<string> {
  try {
    const dateStr = execSync('git log -1 --format="%cd" --date=iso').toString().trim();
    const d = new Date(dateStr);
    return d.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZoneName: "short"
    });
  } catch (e) {
    return "Unknown";
  }
}
