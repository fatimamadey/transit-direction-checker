import { auth } from "@clerk/nextjs/server";
import { notFound } from "next/navigation";
import { BoardPageShell } from "@/components/board-page-shell";
import { getBoardPageData } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function BoardPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { userId } = await auth();

  try {
    const data = await getBoardPageData(slug, userId ?? null);
    return (
      <main className="mx-auto min-h-screen max-w-6xl px-6 py-10">
        <BoardPageShell data={data} />
      </main>
    );
  } catch {
    notFound();
  }
}
