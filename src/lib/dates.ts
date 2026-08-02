export const FOLLOW_UP_THRESHOLD_DAYS = 7;

export function daysSince(date: Date | string): number {
  const d = typeof date === "string" ? new Date(date) : date;
  return (Date.now() - d.getTime()) / (1000 * 60 * 60 * 24);
}

export function needsFollowUp(stage: string, updatedAt: Date | string): boolean {
  return stage === "applied" && daysSince(updatedAt) > FOLLOW_UP_THRESHOLD_DAYS;
}

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export function toInputDate(date: Date | string | null | undefined): string {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toISOString().slice(0, 10);
}
