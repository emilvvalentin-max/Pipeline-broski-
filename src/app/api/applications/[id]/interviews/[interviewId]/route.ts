import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getUser } from "@/lib/supabase/server";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; interviewId: string }> }
) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { interviewId } = await params;
  const owned = await db.interviewLog.findFirst({
    where: { id: interviewId, application: { userId: user.id } },
  });
  if (!owned) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const data: Record<string, unknown> = {};
  for (const key of ["round", "interviewerNames", "questionsAsked", "howItWent", "outcome"] as const) {
    if (key in body) data[key] = body[key];
  }
  if ("date" in body) data.date = new Date(body.date);

  const log = await db.interviewLog.update({ where: { id: interviewId }, data });
  return NextResponse.json(log);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; interviewId: string }> }
) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { interviewId } = await params;
  const owned = await db.interviewLog.findFirst({
    where: { id: interviewId, application: { userId: user.id } },
  });
  if (!owned) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await db.interviewLog.delete({ where: { id: interviewId } });
  return NextResponse.json({ ok: true });
}
