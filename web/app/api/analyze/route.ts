import { NextRequest, NextResponse } from "next/server";
import { analyzeSingle } from "@/lib/hf";
import { preprocessText } from "@/lib/preprocess";

export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json();

    if (!text || typeof text !== "string" || text.trim().length < 3) {
      return NextResponse.json({ error: "Text too short." }, { status: 400 });
    }

    const result = await analyzeSingle(preprocessText(text.trim()));
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
