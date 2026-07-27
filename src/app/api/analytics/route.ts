import { NextResponse } from "next/server";
import { computeAnalytics } from "@/lib/analytics";

export async function GET() {
  const summary = await computeAnalytics();
  return NextResponse.json(summary);
}
