import { NextResponse } from "next/server";
import { computeAnalytics } from "@/lib/analytics";
import { getUser } from "@/lib/supabase/server";

export async function GET() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const summary = await computeAnalytics(user.id);
  return NextResponse.json(summary);
}
