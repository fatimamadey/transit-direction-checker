import { NextResponse } from "next/server";
import { getBoardEventsBySlug } from "@/lib/data";

export async function GET(request: Request, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params;
  const { searchParams } = new URL(request.url);
  const since = searchParams.get("since");

  try {
    const events = await getBoardEventsBySlug(slug, since, 50);
    return NextResponse.json({
      events: events.reverse(),
      serverTime: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load board events." },
      { status: 500 }
    );
  }
}
