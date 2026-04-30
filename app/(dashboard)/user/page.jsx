import { createServerClient } from "@/lib/supabase/server";
import { StatCard } from "@/components/ui/Card";
import { Video, Coins, ShoppingBag, Award } from "lucide-react";
import UserDashboardClient from "@/components/dashboard/UserDashboardClient";

export default async function UserDashboard() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [
    { data: profile },
    { count: registeredMeetings },
    { count: orderCount },
    { data: subscription },
  ] = await Promise.all([
    supabase.from("profiles").select("karma_coins").eq("id", user.id).single(),
    supabase.from("meeting_registrations").select("*", { count: "exact", head: true }).eq("user_id", user.id),
    supabase.from("orders").select("*", { count: "exact", head: true }).eq("user_id", user.id),
    supabase.from("subscriptions").select("id, status, tier").eq("user_id", user.id).eq("status", "active").maybeSingle(),
  ]);

  return (
    <UserDashboardClient
      balance={profile?.karma_coins ?? 0}
      registeredMeetings={registeredMeetings ?? 0}
      orderCount={orderCount ?? 0}
      subscription={subscription}
    />
  );
}
