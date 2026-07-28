import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getUser } from "@/lib/supabase/server";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; contactId: string }> }
) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { contactId } = await params;
  const owned = await db.networkingContact.findFirst({
    where: { id: contactId, application: { userId: user.id } },
  });
  if (!owned) return NextResponse.json({ error: "Not found" }, { status: 404 });

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
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { contactId } = await params;
  const owned = await db.networkingContact.findFirst({
    where: { id: contactId, application: { userId: user.id } },
  });
  if (!owned) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await db.networkingContact.delete({ where: { id: contactId } });
  return NextResponse.json({ ok: true });
}
