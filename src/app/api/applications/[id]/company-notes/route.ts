import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const notes = await db.companyNote.upsert({
    where: { applicationId: id },
    update: {
      culture: body.culture ?? null,
      recentNews: body.recentNews ?? null,
      whyThisCompany: body.whyThisCompany ?? null,
    },
    create: {
      applicationId: id,
      culture: body.culture ?? null,
      recentNews: body.recentNews ?? null,
      whyThisCompany: body.whyThisCompany ?? null,
    },
  });
  return NextResponse.json(notes);
}
