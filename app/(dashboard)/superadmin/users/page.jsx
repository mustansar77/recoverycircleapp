import UsersManager from "@/components/users/UsersManager";
import { createServerClient } from "@/lib/supabase/server";
import { getAdminClient } from "@/lib/supabase/admin";

export default async function SuperAdminUsersPage() {
  const supabase = await createServerClient();
  const admin    = getAdminClient();

  const [
    { count: admins },
    { count: guides },
    { count: users },
    { count: subs },
  ] = await Promise.all([
    admin.from("profiles").select("*", { count: "exact", head: true }).eq("role", "admin"),
    admin.from("profiles").select("*", { count: "exact", head: true }).eq("role", "guide"),
    admin.from("profiles").select("*", { count: "exact", head: true }).eq("role", "user"),
    admin.from("subscriptions").select("*", { count: "exact", head: true }).eq("status", "active"),
  ]);

  return (
    <UsersManager stats={{ admins: admins ?? 0, guides: guides ?? 0, users: users ?? 0, subs: subs ?? 0 }} />
  );
}
