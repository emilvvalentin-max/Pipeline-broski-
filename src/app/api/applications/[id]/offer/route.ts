import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const offer = await db.offer.upsert({
    where: { applicationId: id },
    update: {
      compensation: body.compensation ?? null,
      benefits: body.benefits ?? null,
      location: body.location ?? null,
      growthNotes: body.growthNotes ?? null,
    },
    create: {
      applicationId: id,
      compensation: body.compensation ?? null,
      benefits: body.benefits ?? null,
      location: body.location ?? null,
      growthNotes: body.growthNotes ?? null,
    },
  });
  return NextResponse.json(offer);
}
