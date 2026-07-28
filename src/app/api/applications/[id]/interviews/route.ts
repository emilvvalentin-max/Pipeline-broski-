import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getUser } from "@/lib/supabase/server";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const owned = await db.application.findFirst({ where: { id, userId: user.id } });
  if (!owned) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const log = await db.interviewLog.create({
    data: {
      applicationId: id,
      date: body.date ? new Date(body.date) : new Date(),
      round: body.round ?? "",
      interviewerNames: body.interviewerNames || null,
      questionsAsked: body.questionsAsked || null,
      howItWent: body.howItWent || null,
      outcome: body.outcome || null,
    },
  });
  return NextResponse.json(log, { status: 201 });
}
