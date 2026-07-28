import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { Source } from "@/generated/prisma/client";
import { extractListing, computeFitScore, draftDocuments } from "@/lib/gemini";
import { getUser } from "@/lib/supabase/server";

const VALID_SOURCES = new Set(Object.values(Source));

export async function GET() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const applications = await db.application.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: "desc" },
  });
  return NextResponse.json(applications);
}

export async function POST(req: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const rawInput: string = body.rawInput ?? "";
  const requestedSource: string = body.source ?? "other";
  const sourceUrl: string | undefined = body.sourceUrl || undefined;
  const source = VALID_SOURCES.has(requestedSource as Source) ? (requestedSource as Source) : Source.other;

  if (!rawInput.trim()) {
    return NextResponse.json({ error: "rawInput is required" }, { status: 400 });
  }

  let pageContent = rawInput;
  if (sourceUrl) {
    try {
      const res = await fetch(sourceUrl, { headers: { "User-Agent": "Mozilla/5.0" } });
      const html = await res.text();
      pageContent = `${rawInput}\n\n${html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ")}`;
    } catch {
      // fall back to whatever raw text/URL the user pasted
    }
  }

  const profile = await db.profile.findUnique({ where: { id: user.id } });
  const resumeText = profile?.baseResumeText ?? "";
  const hasResume = resumeText.trim().length > 0;

  try {
    const listing = await extractListing(pageContent);
    const fit = hasResume
      ? await computeFitScore(resumeText, listing.description)
      : { fitScore: null, rationale: "No base resume set in Profile yet — add one to get fit scores and drafts." };
    const docs = hasResume ? await draftDocuments(resumeText, listing.description, listing.company) : null;

    const application = await db.application.create({
      data: {
        userId: user.id,
        title: listing.title,
        company: listing.company,
        role: listing.role,
        rawListing: listing.description,
        deadline: listing.deadline ? new Date(listing.deadline) : null,
        fitScore: fit.fitScore,
        source,
        sourceUrl,
        stage: "researching",
        stageEvents: { create: { stage: "researching" } },
        ...(docs
          ? {
              documentVersions: {
                create: [
                  { type: "cv" as const, versionNumber: 1, content: docs.cv },
                  { type: "cover_letter" as const, versionNumber: 1, content: docs.coverLetter },
                ],
              },
            }
          : {}),
      },
    });

    return NextResponse.json({ application, fitRationale: fit.rationale }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to process this listing";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
