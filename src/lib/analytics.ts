import { db } from "@/lib/db";
import { STAGE_ORDER } from "@/lib/stages";
import type { Stage } from "@/generated/prisma/client";

export interface AnalyticsSummary {
  stageCounts: Record<Stage, number>;
  totalApplications: number;
  totalApplied: number;
  responseRate: number | null;
  interviewConversionRate: number | null;
  avgResponseDays: number | null;
  rejectedCount: number;
}

export async function computeAnalytics(): Promise<AnalyticsSummary> {
  const applications = await db.application.findMany({
    include: { stageEvents: { orderBy: { occurredAt: "asc" } } },
  });

  const stageCounts = Object.fromEntries(STAGE_ORDER.map((s) => [s, 0])) as Record<Stage, number>;
  for (const app of applications) stageCounts[app.stage]++;

  let totalApplied = 0;
  let responded = 0;
  let reachedInterview = 0;
  let rejected = 0;
  const responseTimesMs: number[] = [];

  for (const app of applications) {
    const appliedEvent = app.stageEvents.find((e) => e.stage === "applied");
    if (!appliedEvent) continue;
    totalApplied++;

    const laterEvents = app.stageEvents
      .filter((e) => e.stage !== "applied" && e.occurredAt.getTime() > appliedEvent.occurredAt.getTime())
      .sort((a, b) => a.occurredAt.getTime() - b.occurredAt.getTime());

    if (laterEvents.length > 0) {
      responded++;
      responseTimesMs.push(laterEvents[0].occurredAt.getTime() - appliedEvent.occurredAt.getTime());
    }
    if (app.stageEvents.some((e) => e.stage === "interview")) reachedInterview++;
    if (app.stage === "rejected") rejected++;
  }

  return {
    stageCounts,
    totalApplications: applications.length,
    totalApplied,
    responseRate: totalApplied > 0 ? responded / totalApplied : null,
    interviewConversionRate: totalApplied > 0 ? reachedInterview / totalApplied : null,
    avgResponseDays:
      responseTimesMs.length > 0
        ? responseTimesMs.reduce((a, b) => a + b, 0) / responseTimesMs.length / (1000 * 60 * 60 * 24)
        : null,
    rejectedCount: rejected,
  };
}
