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
