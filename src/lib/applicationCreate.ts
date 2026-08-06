import { db } from "@/lib/db";
import { Source } from "@/generated/prisma/client";
import { extractListing, computeFitScore, draftDocuments } from "@/lib/gemini";
import { buildPageContent } from "@/lib/listingFetch";

export interface CreateApplicationParams {
  userId: string;
  rawInput: string;
  sourceUrl?: string;
  source: Source;
  // Set when rawInput already holds the full, pre-parsed listing text (e.g. from Discover) —
  // skips re-fetching sourceUrl, which is unreliable for sites like LinkedIn that authwall server-side fetches.
  skipFetch?: boolean;
  // Draft a tailored CV + cover letter alongside the listing. Off by default for bulk-import
  // flows, where drafting for every link would blow the request's time budget.
  includeDrafts?: boolean;
}

export async function createApplicationFromListing(params: CreateApplicationParams) {
  const { userId, rawInput, sourceUrl, source, skipFetch = false, includeDrafts = false } = params;

  const pageContent = skipFetch ? rawInput : await buildPageContent(rawInput, sourceUrl);

  const profile = await db.profile.findUnique({ where: { id: userId } });
  const resumeText = profile?.baseResumeText ?? "";
  const hasResume = resumeText.trim().length > 0;

  const listing = await extractListing(pageContent);
  const fit = hasResume
    ? await computeFitScore(resumeText, listing.description)
    : { fitScore: null, rationale: "No base resume set in Profile yet — add one to get fit scores and drafts." };
  const docs = includeDrafts && hasResume ? await draftDocuments(resumeText, listing.description, listing.company) : null;

  const application = await db.application.create({
    data: {
      userId,
      title: listing.title,
      company: listing.company,
      role: listing.role,
      rawListing: listing.description,
      deadline: listing.deadline ? new Date(listing.deadline) : null,
      location: listing.location,
      accommodationProvided: listing.accommodationProvided,
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

  return { application, fitRationale: fit.rationale };
}
