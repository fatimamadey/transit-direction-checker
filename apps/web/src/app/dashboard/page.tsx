import { DashboardShell } from "@/components/dashboard-shell";
import { getDashboardData } from "@/lib/data";
import { DEMO_USER_ID } from "@/lib/demo-user";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  let dashboardData;

  try {
    dashboardData = await getDashboardData(DEMO_USER_ID);
  } catch (error) {
    console.error("Dashboard failed to load:", error);

    dashboardData = {
      stations: [],
      trips: []
    };
  }

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-6 py-10">
      <DashboardShell dashboardData={dashboardData} userName="friend" />
    </main>
  );
}
