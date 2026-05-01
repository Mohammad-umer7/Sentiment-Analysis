import { NextRequest, NextResponse } from "next/server";
import { analyzeBatch } from "@/lib/hf";
import { preprocessText } from "@/lib/preprocess";

const MAX_ROWS = 2000;

export async function POST(req: NextRequest) {
  try {
    const { texts } = await req.json();

    if (!Array.isArray(texts) || texts.length === 0) {
      return NextResponse.json({ error: "No texts provided." }, { status: 400 });
    }

    if (texts.length > MAX_ROWS) {
      return NextResponse.json(
        { error: `Max ${MAX_ROWS} rows allowed. Your file has ${texts.length}.` },
        { status: 400 }
      );
    }

    const results = await analyzeBatch(texts.slice(0, MAX_ROWS).map(preprocessText));
    return NextResponse.json({ results });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
