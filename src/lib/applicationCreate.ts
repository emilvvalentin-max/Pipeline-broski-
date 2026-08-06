import { db } from "@/lib/db";
import { Source } from "@/generated/prisma/client";
import { extractListing, computeFitScore, draftDocuments, ExtractedListing } from "@/lib/gemini";
import { buildPageContent } from "@/lib/listingFetch";

export interface CreateApplicationParams {
  userId: string;
  sourceUrl?: string;
  source: Source;
  // Raw text/URL to run through extraction. Required unless `listing` is given directly.
  rawInput?: string;
  // Set when rawInput already holds the full, pre-parsed listing text (e.g. from Discover) —
  // skips re-fetching sourceUrl, which is unreliable for sites like LinkedIn that authwall server-side fetches.
  skipFetch?: boolean;
  // A already-extracted (and possibly user-edited) listing — skips buildPageContent + extractListing
  // entirely and uses these fields as-is. Used by review-before-add flows (e.g. PDF import).
  listing?: ExtractedListing;
  // Draft a tailored CV + cover letter alongside the listing. Off by default for bulk-import
  // flows, where drafting for every link would blow the request's time budget.
  includeDrafts?: boolean;
}

export async function createApplicationFromListing(params: CreateApplicationParams) {
  const { userId, sourceUrl, source, skipFetch = false, includeDrafts = false } = params;

  const profile = await db.profile.findUnique({ where: { id: userId } });
  const resumeText = profile?.baseResumeText ?? "";
  const hasResume = resumeText.trim().length > 0;

  const listing = params.listing
    ? params.listing
    : await extractListing(skipFetch ? (params.rawInput ?? "") : await buildPageContent(params.rawInput ?? "", sourceUrl));
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
