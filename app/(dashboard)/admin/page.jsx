import { createServerClient } from "@/lib/supabase/server";
import { StatCard } from "@/components/ui/Card";
import { Video, Users, Award } from "lucide-react";

export default async function AdminDashboard() {
  const supabase = await createServerClient();

  const [
    { count: upcomingMeetings },
    { count: guideMeetings },
    { count: pendingRequests },
  ] = await Promise.all([
    supabase.from("meetings").select("*", { count: "exact", head: true }).eq("status", "upcoming"),
    supabase.from("meetings").select("*", { count: "exact", head: true }).eq("type", "guide").eq("status", "upcoming"),
    supabase.from("reward_requests").select("*", { count: "exact", head: true }).eq("status", "pending"),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "var(--text)" }}>Admin Dashboard</h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-3)" }}>Manage meetings and rewards</p>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Upcoming Meetings" value={upcomingMeetings ?? 0} icon={Video}  color="teal"   />
        <StatCard label="Guide Meetings"    value={guideMeetings    ?? 0} icon={Users}  color="purple" />
        <StatCard label="Pending Rewards"   value={pendingRequests  ?? 0} icon={Award}  color="amber"  />
      </div>
    </div>
  );
}
