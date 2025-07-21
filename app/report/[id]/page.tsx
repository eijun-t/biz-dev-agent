import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { ArrowLeft, Download, Share } from "lucide-react";
import ReportViewerWrapper from "@/components/report/ReportViewerWrapper";

interface ReportPageProps {
  params: {
    id: string;
  };
}

export default async function ReportPage({ params }: ReportPageProps) {
  const supabase = await createClient();
  
  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) {
    redirect("/auth/login");
  }

  // レポートデータを取得
  const { data: report, error: reportError } = await supabase
    .from('reports')
    .select('*')
    .eq('id', params.id)
    .eq('user_id', data.user.id)
    .single();

  if (reportError || !report) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>レポートが見つかりません</CardTitle>
            <CardDescription>
              指定されたレポートは存在しないか、アクセス権限がありません。
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/dashboard">
                <ArrowLeft className="h-4 w-4 mr-2" />
                ダッシュボードに戻る
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // html_contentからレポートデータを復元
  let reportData = null;
  let sections = [];
  let qualityAssessment = null;
  let generationProcesses = [];

  if (report.html_content) {
    try {
      const fullReportData = JSON.parse(report.html_content);
      reportData = fullReportData.reportData;
      sections = fullReportData.generatedReport?.sections || [];
      qualityAssessment = fullReportData.generatedReport?.quality_assessment;
      generationProcesses = fullReportData.generatedReport?.generation_process || [];
    } catch (error) {
      console.error('Failed to parse report data:', error);
    }
  }

  // ReportViewerコンポーネントが期待する形式にデータがある場合
  if (reportData && sections.length > 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-100 via-blue-50 to-indigo-100">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <Button variant="outline" asChild>
              <Link href="/dashboard">
                ← ダッシュボードに戻る
              </Link>
            </Button>
          </div>
          <ReportViewerWrapper
            reportData={reportData}
            sections={sections}
            qualityAssessment={qualityAssessment}
            generationProcesses={generationProcesses}
            isGenerating={false}
          />
        </div>
      </div>
    );
  }

  // フォールバック：基本的な情報表示
  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard">
              <ArrowLeft className="h-4 w-4 mr-2" />
              ダッシュボード
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{report.title}</h1>
            <p className="text-muted-foreground">
              作成日: {new Date(report.created_at).toLocaleDateString('ja-JP')}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Badge 
            variant={report.status === 'completed' ? 'default' : 'secondary'}
          >
            {report.status}
          </Badge>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            エクスポート
          </Button>
          <Button variant="outline" size="sm">
            <Share className="h-4 w-4 mr-2" />
            共有
          </Button>
        </div>
      </div>

      {/* レポート情報 */}
      <Card>
        <CardHeader>
          <CardTitle>レポート情報</CardTitle>
          <CardDescription>
            保存されたレポートの詳細情報
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold">タイトル</h3>
              <p className="text-muted-foreground">{report.title}</p>
            </div>
            <div>
              <h3 className="font-semibold">ステータス</h3>
              <p className="text-muted-foreground">{report.status}</p>
            </div>
            <div>
              <h3 className="font-semibold">作成日時</h3>
              <p className="text-muted-foreground">
                {new Date(report.created_at).toLocaleString('ja-JP')}
              </p>
            </div>
            {report.content && (
              <div>
                <h3 className="font-semibold">基本情報</h3>
                <div className="mt-2 p-4 bg-gray-50 rounded">
                  <p><strong>ターゲット:</strong> {report.content.target}</p>
                  <p><strong>課題:</strong> {report.content.challenges}</p>
                  <p><strong>収益化:</strong> {report.content.monetization}</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}