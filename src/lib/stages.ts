import type { Stage } from "@/generated/prisma/client";

export const STAGE_ORDER: Stage[] = ["researching", "applied", "interview", "offer", "rejected"];

export const STAGE_LABEL: Record<Stage, string> = {
  researching: "Researching",
  applied: "Applied",
  interview: "Interview",
  offer: "Offer",
  rejected: "Rejected",
};

export const STAGE_CLASS: Record<Stage, string> = {
  researching: "stage-researching",
  applied: "stage-applied",
  interview: "stage-interview",
  offer: "stage-offer",
  rejected: "stage-rejected",
};

// Validated (dataviz skill) categorical colors for the analytics chart — kept
// separate from the decorative gradient orbs used on cards/badges.
export const STAGE_CHART_COLOR: Record<Stage, string> = {
  researching: "#3987e5",
  applied: "#d95926",
  interview: "#199e70",
  offer: "#c98500",
  rejected: "#d55181",
};

export const SOURCE_LABEL: Record<string, string> = {
  finn: "Finn.no",
  linkedin: "LinkedIn",
  referral: "Referral",
  direct: "Direct",
  other: "Other",
};

export function detectSourceFromUrl(url: string): keyof typeof SOURCE_LABEL {
  try {
    const host = new URL(url).hostname;
    if (host.includes("finn.no")) return "finn";
    if (host.includes("linkedin.com")) return "linkedin";
    return "direct";
  } catch {
    return "direct";
  }
}
