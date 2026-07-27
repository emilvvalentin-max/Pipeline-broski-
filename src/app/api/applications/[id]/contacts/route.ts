import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
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
