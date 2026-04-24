import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { syncProfileAction } from "@/actions/sync-profile";
import { DashboardShell } from "@/components/dashboard-shell";
import { getDashboardData } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const user = await currentUser();

  await syncProfileAction({
    clerkUserId: userId,
    email: user?.emailAddresses[0]?.emailAddress ?? "unknown@example.com",
    githubLogin: user?.username ?? null
  });

  const dashboardData = await getDashboardData(userId);

  return (
    <main className="mx-auto min-h-screen max-w-[1500px] px-4 py-4 sm:px-6 lg:px-8">
      <DashboardShell
        dashboardData={dashboardData}
        userName={user?.firstName ?? user?.username ?? "friend"}
      />
    </main>
  );
}
