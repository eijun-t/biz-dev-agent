import { createClient } from "@/lib/supabase/server";
import { Homepage } from "@/components/homepage";

export default async function Index() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return <Homepage user={user} />;
}
