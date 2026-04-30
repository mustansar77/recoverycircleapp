import { createServerClient } from "@/lib/supabase/server";
import CertificationPage from "@/components/certification/CertificationPage";

export default async function UserCertificationPage() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [{ data: profile }, { data: subscription }] = await Promise.all([
    supabase.from("profiles").select("role, karma_coins").eq("id", user.id).single(),
    supabase.from("subscriptions").select("id, status, tier").eq("user_id", user.id).eq("status", "active").maybeSingle(),
  ]);

  return (
    <CertificationPage
      existingSubscription={subscription}
      userRole={profile?.role}
      karmaBalance={profile?.karma_coins ?? 0}
    />
  );
}
