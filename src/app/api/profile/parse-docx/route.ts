import { NextRequest, NextResponse } from "next/server";
import mammoth from "mammoth";
import { getUser } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const form = await req.formData();
  const file = form.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  try {
    const { value } = await mammoth.extractRawText({ buffer });
    return NextResponse.json({ text: value.trim() });
  } catch {
    return NextResponse.json({ error: "Couldn't read that .docx file" }, { status: 400 });
  }
}
