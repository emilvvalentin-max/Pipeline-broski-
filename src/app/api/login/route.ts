import { NextRequest, NextResponse } from "next/server";
import { COOKIE_NAME, SESSION_DURATION_SECONDS, createSessionToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const { passcode } = await req.json();
  const expected = process.env.APP_PASSCODE;

  if (!expected) {
    return NextResponse.json({ error: "APP_PASSCODE is not configured" }, { status: 500 });
  }

  if (passcode !== expected) {
    return NextResponse.json({ error: "Incorrect passcode" }, { status: 401 });
  }

  const token = await createSessionToken();
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DURATION_SECONDS,
  });
  return res;
}
