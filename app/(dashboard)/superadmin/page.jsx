import { createServerClient } from "@/lib/supabase/server";
import { StatCard } from "@/components/ui/Card";
import { Users, ShieldCheck, BookOpen, CreditCard } from "lucide-react";

export default async function SuperAdminDashboard() {
  const supabase = await createServerClient();

  const [
    { count: adminCount },
    { count: guideCount },
    { count: userCount },
    { count: subCount },
  ] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "admin"),
    supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "guide"),
    supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "user"),
    supabase.from("subscriptions").select("*", { count: "exact", head: true }).eq("status", "active"),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "var(--text)" }}>Dashboard Overview</h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-3)" }}>Platform activity at a glance</p>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Admins"               value={adminCount ?? 0} icon={ShieldCheck} color="blue"   />
        <StatCard label="Guides"               value={guideCount ?? 0} icon={BookOpen}    color="purple" />
        <StatCard label="Members"              value={userCount  ?? 0} icon={Users}       color="teal"   />
        <StatCard label="Active Subscriptions" value={subCount   ?? 0} icon={CreditCard}  color="amber"  />
      </div>
    </div>
  );
}
