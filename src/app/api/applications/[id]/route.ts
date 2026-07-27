import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { Stage } from "@/generated/prisma/client";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const application = await db.application.findUnique({
    where: { id },
    include: {
      interviewLogs: { orderBy: { date: "asc" } },
      companyNotes: true,
      networkingContacts: { orderBy: { createdAt: "asc" } },
      documentVersions: { orderBy: { versionNumber: "desc" } },
      offer: true,
      stageEvents: { orderBy: { occurredAt: "asc" } },
    },
  });
  if (!application) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(application);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();

  const data: Record<string, unknown> = {};
  for (const key of ["title", "company", "role", "sourceUrl", "source", "urgent"] as const) {
    if (key in body) data[key] = body[key];
  }
  if ("deadline" in body) data.deadline = body.deadline ? new Date(body.deadline) : null;
  if ("appliedAt" in body) data.appliedAt = body.appliedAt ? new Date(body.appliedAt) : null;
  if ("fitScore" in body) data.fitScore = body.fitScore;

  const isStageChange = "stage" in body && Object.values(Stage).includes(body.stage);
  if (isStageChange) {
    data.stage = body.stage;
    if (body.stage === "applied" && !body.appliedAt) {
      data.appliedAt = new Date();
    }
  }

  const application = await db.application.update({
    where: { id },
    data: {
      ...data,
      ...(isStageChange ? { stageEvents: { create: { stage: body.stage } } } : {}),
    },
  });

  return NextResponse.json(application);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await db.application.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
