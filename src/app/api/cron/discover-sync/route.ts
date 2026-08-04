import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { extractListing, computeFitScore } from "@/lib/gemini";

export const maxDuration = 60;

const EARLYCAREERS_API = "https://earlycareers.fabifont.dev/api";
// Broad default watch: the EarlyCareers dataset is already tech-internship-scoped,
// so filtering by location alone covers "software/tech internships in Norway".
const WATCH_LOCATION = "Norway";
const MAX_NEW_PER_USER = 5;

interface EarlyCareersJob {
  link: string;
  title: string;
  location: string;
  company: string;
  description: string | null;
  employment_type: string | null;
  seniority_level: string | null;
}

function buildRawInput(job: EarlyCareersJob): string {
  const lines = [`Title: ${job.title}`, `Company: ${job.company}`, `Location: ${job.location}`];
  if (job.employment_type) lines.push(`Employment type: ${job.employment_type}`);
  if (job.seniority_level) lines.push(`Seniority: ${job.seniority_level}`);
  lines.push("", "Description:", job.description ?? "");
  return lines.join("\n");
}

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const upstream = new URL(`${EARLYCAREERS_API}/jobs/advanced`);
  upstream.searchParams.set("page", "1");
  upstream.searchParams.set("limit", "50");
  upstream.searchParams.set("location", WATCH_LOCATION);

  let jobs: EarlyCareersJob[];
  try {
    const res = await fetch(upstream, { headers: { Accept: "application/json" } });
    if (!res.ok) throw new Error(`Upstream responded ${res.status}`);
    jobs = await res.json();
  } catch {
    return NextResponse.json({ error: "Could not reach the internships source" }, { status: 502 });
  }

  const userRows = await db.application.findMany({
    where: { userId: { not: null } },
    select: { userId: true },
    distinct: ["userId"],
  });
  const userIds = [...new Set(userRows.map((r) => r.userId).filter((id): id is string => !!id))];

  const summary: Record<string, { added: number; skipped: number }> = {};

  for (const userId of userIds) {
    summary[userId] = { added: 0, skipped: 0 };
    const profile = await db.profile.findUnique({ where: { id: userId } });
    const resumeText = profile?.baseResumeText ?? "";
    const hasResume = resumeText.trim().length > 0;

    for (const job of jobs) {
      if (summary[userId].added >= MAX_NEW_PER_USER) break;

      const existing = await db.application.findFirst({ where: { userId, sourceUrl: job.link } });
      if (existing) continue;

      try {
        const listing = await extractListing(buildRawInput(job));
        const fit = hasResume
          ? await computeFitScore(resumeText, listing.description)
          : { fitScore: null, rationale: "" };

        await db.application.create({
          data: {
            userId,
            title: listing.title,
            company: listing.company,
            role: listing.role,
            rawListing: listing.description,
            deadline: listing.deadline ? new Date(listing.deadline) : null,
            location: listing.location ?? job.location,
            accommodationProvided: listing.accommodationProvided,
            fitScore: fit.fitScore,
            source: "linkedin",
            sourceUrl: job.link,
            stage: "researching",
            stageEvents: { create: { stage: "researching" } },
          },
        });
        summary[userId].added++;
      } catch {
        summary[userId].skipped++;
      }
    }
  }

  return NextResponse.json({ ok: true, checked: jobs.length, summary });
}
