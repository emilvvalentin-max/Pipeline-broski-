import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { DocumentType } from "@/generated/prisma/client";
import { draftDocuments } from "@/lib/gemini";

// Manually save an edited version of a document.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const type: DocumentType = body.type === "cover_letter" ? DocumentType.cover_letter : DocumentType.cv;

  const last = await db.documentVersion.findFirst({
    where: { applicationId: id, type },
    orderBy: { versionNumber: "desc" },
  });

  const version = await db.documentVersion.create({
    data: {
      applicationId: id,
      type,
      versionNumber: (last?.versionNumber ?? 0) + 1,
      content: body.content ?? "",
    },
  });
  return NextResponse.json(version, { status: 201 });
}

// Regenerate both documents from the current profile + listing description.
export async function PUT(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [application, profile] = await Promise.all([
    db.application.findUnique({ where: { id } }),
    db.profile.findUnique({ where: { id: "singleton" } }),
  ]);
  if (!application) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!profile?.baseResumeText?.trim()) {
    return NextResponse.json({ error: "Set a base resume in Profile first" }, { status: 400 });
  }

  try {
    const docs = await draftDocuments(profile.baseResumeText, application.rawListing ?? "", application.company);

    const [lastCv, lastCoverLetter] = await Promise.all([
      db.documentVersion.findFirst({ where: { applicationId: id, type: "cv" }, orderBy: { versionNumber: "desc" } }),
      db.documentVersion.findFirst({
        where: { applicationId: id, type: "cover_letter" },
        orderBy: { versionNumber: "desc" },
      }),
    ]);

    const [cv, coverLetter] = await Promise.all([
      db.documentVersion.create({
        data: { applicationId: id, type: "cv", versionNumber: (lastCv?.versionNumber ?? 0) + 1, content: docs.cv },
      }),
      db.documentVersion.create({
        data: {
          applicationId: id,
          type: "cover_letter",
          versionNumber: (lastCoverLetter?.versionNumber ?? 0) + 1,
          content: docs.coverLetter,
        },
      }),
    ]);

    return NextResponse.json({ cv, coverLetter });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Regeneration failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
