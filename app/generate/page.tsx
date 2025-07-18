import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { GenerateReportForm } from "@/components/generate-report-form";

export default async function GeneratePage() {
  const supabase = await createClient();
  
  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) {
    redirect("/auth/login");
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">新事業レポート生成</h1>
        <p className="text-muted-foreground">
          AIエージェントが自律的に市場調査から事業企画まで一貫してレポートを作成します。
        </p>
      </div>

      <GenerateReportForm />
    </div>
  );
}