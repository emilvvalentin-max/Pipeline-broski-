import { NextRequest, NextResponse } from "next/server";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import { db } from "@/lib/db";
import { Source } from "@/generated/prisma/client";
import { extractListing } from "@/lib/gemini";
import { buildPageContent } from "@/lib/listingFetch";
import { detectSourceFromUrl } from "@/lib/stages";
import { getUser } from "@/lib/supabase/server";

export const maxDuration = 60;

// This route only extracts + previews candidates for review — it does not create
// applications. Creation happens per-candidate via POST /api/applications once the
// user has reviewed/edited/deleted what they don't want.
const MAX_CANDIDATES = 20;
// Leave headroom under the function's 60s cap for PDF parsing + the final response.
const TIME_BUDGET_MS = 50_000;

function inferSource(url: string): Source {
  const detected = detectSourceFromUrl(url);
  return detected === "linkedin" || detected === "finn" ? detected : "other";
}

async function extractPdfLinks(bytes: Uint8Array): Promise<string[]> {
  const doc = await getDocument({ data: bytes }).promise;
  const urls = new Set<string>();

  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const annotations = await page.getAnnotations();
    for (const annot of annotations) {
      if (annot.subtype === "Link" && typeof annot.url === "string" && annot.url) {
        urls.add(annot.url);
      }
    }
  }

  return [...urls];
}

export async function POST(req: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "A PDF file is required" }, { status: 400 });
  }

  let links: string[];
  try {
    const bytes = new Uint8Array(await file.arrayBuffer());
    links = await extractPdfLinks(bytes);
  } catch {
    return NextResponse.json({ error: "Could not read that PDF — is it a valid file?" }, { status: 400 });
  }

  const startedAt = Date.now();
  let alreadyTracked = 0;
  let skippedErrors = 0;
  let skippedTimeout = 0;
  const errors: { url: string; message: string }[] = [];
  const candidates: ({ url: string; source: Source } & Awaited<ReturnType<typeof extractListing>>)[] = [];

  for (const url of links) {
    if (candidates.length >= MAX_CANDIDATES) break;

    if (Date.now() - startedAt > TIME_BUDGET_MS) {
      skippedTimeout++;
      continue;
    }

    const existing = await db.application.findFirst({ where: { userId: user.id, sourceUrl: url } });
    if (existing) {
      alreadyTracked++;
      continue;
    }

    try {
      const pageContent = await buildPageContent(url, url);
      const listing = await extractListing(pageContent);
      candidates.push({ url, source: inferSource(url), ...listing });
    } catch (err) {
      skippedErrors++;
      const message = err instanceof Error ? err.message : "Failed to read this listing";
      errors.push({ url, message });
    }
  }

  return NextResponse.json({
    totalLinksFound: links.length,
    alreadyTracked,
    skippedErrors,
    skippedTimeout,
    candidates,
    errors,
  });
}
