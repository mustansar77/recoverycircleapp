import UserStore from "@/components/store/UserStore";
import { createServerClient } from "@/lib/supabase/server";

export default async function UserStorePage() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("karma_coins")
    .eq("id", user.id)
    .single();

  return <UserStore initialBalance={profile?.karma_coins ?? 0} />;
}
