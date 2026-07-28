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
  const contact = await db.networkingContact.create({
    data: {
      applicationId: id,
      contactName: body.contactName ?? "",
      relationship: body.relationship || null,
      warmOrCold: body.warmOrCold === "warm" ? "warm" : "cold",
      hasReachedOut: !!body.hasReachedOut,
      notes: body.notes || null,
    },
  });
  return NextResponse.json(contact, { status: 201 });
}
