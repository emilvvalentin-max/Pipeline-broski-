import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; contactId: string }> }
) {
  const { contactId } = await params;
  const body = await req.json();
  const data: Record<string, unknown> = {};
  for (const key of ["contactName", "relationship", "warmOrCold", "hasReachedOut", "notes"] as const) {
    if (key in body) data[key] = body[key];
  }
  const contact = await db.networkingContact.update({ where: { id: contactId }, data });
  return NextResponse.json(contact);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; contactId: string }> }
) {
  const { contactId } = await params;
  await db.networkingContact.delete({ where: { id: contactId } });
  return NextResponse.json({ ok: true });
}
