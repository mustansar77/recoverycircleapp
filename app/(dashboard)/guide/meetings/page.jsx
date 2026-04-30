import { createServerClient } from "@/lib/supabase/server";
import GuideMeetings from "@/components/meetings/GuideMeetings";

export default async function GuideMeetingsPage() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("karma_coins")
    .eq("id", user.id)
    .single();

  return <GuideMeetings initialBalance={profile?.karma_coins ?? 0} />;
}
