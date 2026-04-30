import { createServerClient } from "@/lib/supabase/server";
import GuideDashboardClient from "@/components/dashboard/GuideDashboardClient";

export default async function GuideDashboard() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [
    { data: profile },
    { count: totalHosted },
    { count: upcomingCount },
  ] = await Promise.all([
    supabase.from("profiles").select("karma_coins").eq("id", user.id).single(),
    supabase.from("meetings").select("*", { count: "exact", head: true }).eq("host_id", user.id).eq("status", "ended"),
    supabase.from("meetings").select("*", { count: "exact", head: true }).eq("host_id", user.id).eq("status", "upcoming"),
  ]);

  return (
    <GuideDashboardClient
      balance={profile?.karma_coins ?? 0}
      totalHosted={totalHosted ?? 0}
      upcomingCount={upcomingCount ?? 0}
    />
  );
}
