import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
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
