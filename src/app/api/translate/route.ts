import { NextRequest, NextResponse } from "next/server";
import { translateToPersian } from "@/lib/translate";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const text = searchParams.get("text") || "";

  if (!text) {
    return NextResponse.json({ translated: "" });
  }

  const translated = await translateToPersian(text);
  return NextResponse.json({ translated });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const text = body?.text || "";
    if (!text) {
      return NextResponse.json({ translated: "" });
    }
    const translated = await translateToPersian(text);
    return NextResponse.json({ translated });
  } catch {
    return NextResponse.json({ translated: "" }, { status: 400 });
  }
}
