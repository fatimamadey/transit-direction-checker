import { auth, currentUser } from "@clerk/nextjs/server";
import { syncProfileAction } from "@/actions/sync-profile";
import { PublicBoardsShell } from "@/components/public-boards-shell";
import { getDashboardData, getPublicBoardsData } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function BoardsDirectoryPage() {
  const { userId } = await auth();

  if (userId) {
    const user = await currentUser();
    await syncProfileAction({
      clerkUserId: userId,
      email: user?.emailAddresses[0]?.emailAddress ?? "unknown@example.com",
      githubLogin: user?.username ?? null
    });

    const dashboardData = await getDashboardData(userId);

    return (
      <main className="mx-auto min-h-screen max-w-[1500px] px-4 py-4 sm:px-6 lg:px-8">
        <PublicBoardsShell
          boards={dashboardData.publicBoards}
          signedIn
          userName={user?.firstName ?? user?.username ?? "member"}
        />
      </main>
    );
  }

  const boards = await getPublicBoardsData(24);

  return (
    <main className="mx-auto min-h-screen max-w-[1500px] px-4 py-4 sm:px-6 lg:px-8">
      <PublicBoardsShell boards={boards} signedIn={false} />
    </main>
  );
}
