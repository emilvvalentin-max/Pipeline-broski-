import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { Source } from "@/generated/prisma/client";
import { createApplicationFromListing } from "@/lib/applicationCreate";
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
  // Set when rawInput already holds the full, pre-parsed listing text (e.g. from Discover) —
  // skips re-fetching sourceUrl, which is unreliable for sites like LinkedIn that authwall server-side fetches.
  const skipFetch: boolean = body.skipFetch === true;

  if (!rawInput.trim()) {
    return NextResponse.json({ error: "rawInput is required" }, { status: 400 });
  }

  try {
    const { application, fitRationale } = await createApplicationFromListing({
      userId: user.id,
      rawInput,
      sourceUrl,
      source,
      skipFetch,
      includeDrafts: true,
    });

    return NextResponse.json({ application, fitRationale }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to process this listing";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
