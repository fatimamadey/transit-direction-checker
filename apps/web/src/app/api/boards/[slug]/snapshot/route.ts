import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getBoardSnapshotBySlug } from "@/lib/data";

export async function GET(request: Request, context: { params: Promise<{ slug: string }> }) {
  const { userId } = await auth();
  const { slug } = await context.params;
  const { searchParams } = new URL(request.url);
  const since = searchParams.get("since");

  try {
    const snapshot = await getBoardSnapshotBySlug(slug, since, userId ?? null);
    return NextResponse.json(snapshot);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load board snapshot." },
      { status: 500 }
    );
  }
}
