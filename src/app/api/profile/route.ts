import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  const profile = await db.profile.findUnique({ where: { id: "singleton" } });
  return NextResponse.json(profile ?? { id: "singleton", baseResumeText: "" });
}

export async function PUT(req: NextRequest) {
  const { baseResumeText } = await req.json();
  const profile = await db.profile.upsert({
    where: { id: "singleton" },
    update: { baseResumeText: baseResumeText ?? "" },
    create: { id: "singleton", baseResumeText: baseResumeText ?? "" },
  });
  return NextResponse.json(profile);
}
