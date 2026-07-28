import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { summarizeRejectionPatterns } from "@/lib/gemini";
import { getUser } from "@/lib/supabase/server";

export async function POST() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rejectedApps = await db.application.findMany({
    where: { stage: "rejected", userId: user.id },
    include: { interviewLogs: { orderBy: { date: "desc" }, take: 1 } },
  });

  if (rejectedApps.length < 2) {
    return NextResponse.json({
      summary: "Not enough rejected applications yet to spot a pattern (need at least a couple).",
    });
  }

  const entries = rejectedApps.map((app) => ({
    company: app.company,
    outcome: app.interviewLogs[0]?.outcome ?? null,
    howItWent: app.interviewLogs[0]?.howItWent ?? null,
  }));

  const summary = await summarizeRejectionPatterns(entries);
  return NextResponse.json({ summary });
}
