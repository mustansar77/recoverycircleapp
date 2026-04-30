import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import ThemeProvider from "@/components/layout/ThemeProvider";
import { createServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function DashboardLayout({ children }) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, email, role, karma_coins")
    .eq("id", user.id)
    .single();

  return (
    <ThemeProvider>
      <div className="flex h-screen overflow-hidden" style={{ backgroundColor: "var(--bg)" }}>
        <Sidebar role={profile?.role} />
        <div className="flex flex-1 flex-col overflow-hidden min-w-0">
          <Header profile={profile} />
          <main className="flex-1 overflow-y-auto p-6 md:p-8">{children}</main>
        </div>
      </div>
    </ThemeProvider>
  );
}
