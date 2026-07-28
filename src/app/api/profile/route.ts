import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getUser } from "@/lib/supabase/server";

export async function GET() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const profile = await db.profile.findUnique({ where: { id: user.id } });
  return NextResponse.json(profile ?? { id: user.id, baseResumeText: "" });
}

export async function PUT(req: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { baseResumeText } = await req.json();
  const profile = await db.profile.upsert({
    where: { id: user.id },
    update: { baseResumeText: baseResumeText ?? "" },
    create: { id: user.id, baseResumeText: baseResumeText ?? "" },
  });
  return NextResponse.json(profile);
}
