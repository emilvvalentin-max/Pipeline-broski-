import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getUser } from "@/lib/supabase/server";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const owned = await db.application.findFirst({ where: { id, userId: user.id } });
  if (!owned) return NextResponse.json({ error: "Not found" }, { status: 404 });

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
