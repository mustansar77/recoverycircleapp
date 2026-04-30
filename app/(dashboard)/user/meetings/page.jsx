import { createServerClient } from "@/lib/supabase/server";
import UserMeetings from "@/components/meetings/UserMeetings";

export default async function UserMeetingsPage() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("karma_coins")
    .eq("id", user.id)
    .single();

  return <UserMeetings initialBalance={profile?.karma_coins ?? 0} />;
}
