'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, BarChart3 } from 'lucide-react';
import Link from 'next/link';
import { User } from '@supabase/supabase-js';
import { 
  ComprehensiveBusinessReport, 
  ReportGenerationResult 
} from '@/lib/agents/report/types';
import ReportViewer from '@/components/report/ReportViewer';

interface HomepageProps {
  user?: User | null;
}

interface WorkflowStep {
  id: string;
  agent: string;
  action: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  timestamp: string;
  duration?: number;
  details?: string;
}

interface WorkflowState {
  phase: 'input' | 'research' | 'ideation' | 'analysis' | 'report' | 'completed';
  current_step: string;
  steps: WorkflowStep[];
  session_id: string;
  progress_percentage: number;
}

export function Homepage({ user }: HomepageProps) {
  const [userInput, setUserInput] = useState('');
  const [workflowState, setWorkflowState] = useState<WorkflowState>({
    phase: 'input',
    current_step: '',
    steps: [],
    session_id: '',
    progress_percentage: 0
  });
  const [isRunning, setIsRunning] = useState(false);
  const [finalReport, setFinalReport] = useState<{
    reportData: ComprehensiveBusinessReport;
    generatedReport: ReportGenerationResult;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const resetToInitialState = () => {
    setFinalReport(null);
    setWorkflowState({
      phase: 'input',
      current_step: '',
      steps: [],
      session_id: '',
      progress_percentage: 0
    });
    setIsRunning(false);
    setError(null);
    setUserInput('');
  };

  const handleStartWorkflow = async () => {
    if (isRunning) return;

    setIsRunning(true);
    setError(null);
    
    const sessionId = `session_${Date.now()}`;
    setWorkflowState({
      phase: 'research',
      current_step: 'initializing',
      steps: [],
      session_id: sessionId,
      progress_percentage: 0
    });

    try {
      // Use production workflow if user is authenticated, otherwise use test workflow
      const endpoint = user ? '/api/agents/workflow/production' : '/api/agents/workflow/test';
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'start',
          user_input: userInput || 'AI・IoT・DXを活用した新しいビジネス領域の探索',
          session_id: sessionId
        })
      });

      if (!response.ok) {
        throw new Error('ワークフロー開始に失敗しました');
      }

      // Start polling for updates
      startPolling(sessionId);

    } catch (error) {
      console.error('Workflow start error:', error);
      setError(error instanceof Error ? error.message : 'ワークフローの開始に失敗しました');
      setIsRunning(false);
    }
  };

  const startPolling = (sessionId: string) => {
    const pollInterval = setInterval(async () => {
      try {
        const endpoint = user ? '/api/agents/workflow/production' : '/api/agents/workflow/test';
        const response = await fetch(`${endpoint}?session_id=${sessionId}`);
        if (!response.ok) return;

        const status = await response.json();
        
        setWorkflowState(prev => ({
          ...prev,
          phase: status.phase,
          current_step: status.current_step,
          steps: status.steps,
          progress_percentage: status.progress_percentage
        }));

        if (status.phase === 'completed') {
          clearInterval(pollInterval);
          setIsRunning(false);
          if (status.final_report) {
            setFinalReport(status.final_report);
          }
        } else if (status.phase === 'failed') {
          clearInterval(pollInterval);
          setIsRunning(false);
          setError(status.error || 'ワークフローが失敗しました');
        }
      } catch (error) {
        console.error('Polling error:', error);
      }
    }, 2000);
  };

  const getAgentIcon = (agent: string) => {
    const icons = {
      'planner': '🧠',
      'researcher': '🔍',
      'ideator': '💡',
      'critic': '📝',
      'analyst': '📊',
      'writer': '✍️',
      'coordinator': '🎯'
    };
    return icons[agent as keyof typeof icons] || '🤖';
  };

  const getStatusColor = (status: string) => {
    const colors = {
      'pending': 'bg-gray-100 text-gray-600',
      'in_progress': 'bg-blue-100 text-blue-700',
      'completed': 'bg-green-100 text-green-700',
      'failed': 'bg-red-100 text-red-700'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-600';
  };

  const getPhaseDescription = (phase: string) => {
    const descriptions = {
      'research': '🔍 市場調査・技術トレンド分析',
      'ideation': '💡 ビジネスアイデア生成・評価',
      'analysis': '📊 詳細分析・市場規模算出',
      'report': '📄 最終レポート生成',
      'completed': '✅ 完了'
    };
    return descriptions[phase as keyof typeof descriptions] || '';
  };

  // 未認証の場合の表示
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-100 via-blue-50 to-indigo-100">
        <div className="bg-white/80 backdrop-blur-sm border-b">
          <div className="max-w-6xl mx-auto px-4 py-6">
            <div className="text-center">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                AI Business Generator
              </h1>
              <p className="text-gray-600 mt-2">
                マルチエージェントAIがビジネスアイデアから詳細レポートまで自動生成
              </p>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 py-12">
          <Card className="text-center">
            <CardHeader>
              <CardTitle>レポート生成を開始</CardTitle>
              <CardDescription>
                アカウントを作成またはログインして、AIビジネスレポート生成を始めましょう
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button size="lg" asChild>
                  <Link href="/auth/signup">
                    無料で始める
                  </Link>
                </Button>
                <Button variant="outline" size="lg" asChild>
                  <Link href="/auth/login">
                    ログイン
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // 最終レポート表示
  if (finalReport) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-100 via-blue-50 to-indigo-100">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <Button variant="outline" onClick={resetToInitialState}>
              ← 新しいレポート生成
            </Button>
            <Button variant="outline" asChild>
              <Link href="/dashboard">
                <FileText className="h-4 w-4 mr-2" />
                ダッシュボード
              </Link>
            </Button>
          </div>
          <ReportViewer
            reportData={finalReport.reportData}
            sections={finalReport.generatedReport.sections}
            qualityAssessment={finalReport.generatedReport.quality_assessment}
            generationProcesses={finalReport.generatedReport.generation_process}
            isGenerating={false}
            onRegenerateSection={() => {}}
            onExportReport={() => {}}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-blue-50 to-indigo-100">
      {/* ヘッダー */}
      <div className="bg-white/80 backdrop-blur-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="text-center flex-1">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                AI Business Generator
              </h1>
              <p className="text-gray-600 mt-2">
                マルチエージェントAIがビジネスアイデアから詳細レポートまで自動生成
              </p>
            </div>
            <Button variant="outline" asChild>
              <Link href="/dashboard">
                <FileText className="h-4 w-4 mr-2" />
                ダッシュボード
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* 入力フォーム */}
        {workflowState.phase === 'input' && (
          <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">
              🚀 新規事業アイデア生成を開始
            </h2>
            
            <div className="space-y-6">
              <div>
                <label htmlFor="business-input" className="block text-sm font-medium text-gray-700 mb-2">
                  事業領域・条件・制約など（空白でも開始可能）
                </label>
                <textarea
                  id="business-input"
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  placeholder="例：AI・IoT技術を活用した不動産管理事業、初期投資3億円以下、三菱地所の既存アセット活用..."
                  className="w-full h-32 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  disabled={isRunning}
                />
              </div>

              <div className={`rounded-lg p-4 ${user ? 'bg-green-50' : 'bg-blue-50'}`}>
                <h3 className={`font-medium mb-2 ${user ? 'text-green-900' : 'text-blue-900'}`}>
                  {user ? '🤖 AI エージェント実行プロセス' : '🔄 デモ実行プロセス'}
                </h3>
                <div className={`text-sm space-y-1 ${user ? 'text-green-700' : 'text-blue-700'}`}>
                  <div>• 📊 {user ? 'GPT-4による' : ''}市場調査・技術トレンド分析</div>
                  <div>• 💡 {user ? 'AI駆動' : ''}ビジネスアイデア生成・評価</div>
                  <div>• 📈 {user ? '高度な' : ''}詳細分析・競合調査</div>
                  <div>• 📄 {user ? 'プロフェッショナル' : ''}包括的レポート生成</div>
                  {user && <div>• ✨ 品質評価・改善提案</div>}
                </div>
                {user && (
                  <div className="mt-2 text-xs text-green-600 font-medium">
                    ※ 実際のAIエージェントによる高品質レポート生成
                  </div>
                )}
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-700">❌ {error}</p>
                </div>
              )}

              <div className="text-center">
                <button
                  onClick={handleStartWorkflow}
                  disabled={isRunning}
                  className="px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white text-lg font-semibold rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
                >
                  {isRunning ? (
                    <span className="flex items-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      実行中...
                    </span>
                  ) : (
                    '🚀 ビジネス生成を開始'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* プロセス表示 */}
        {workflowState.phase !== 'input' && (
          <div className="space-y-6">
            {/* 進行状況バー */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">
                  {getPhaseDescription(workflowState.phase)}
                </h2>
                <div className="text-sm text-gray-500">
                  {workflowState.progress_percentage}% 完了
                </div>
              </div>
              
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-purple-600 to-blue-600 h-2 rounded-full transition-all duration-1000"
                  style={{ width: `${workflowState.progress_percentage}%` }}
                ></div>
              </div>
            </div>

            {/* エージェント活動表示 */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                🤖 エージェント活動履歴
              </h3>
              
              <div className="space-y-2">
                {workflowState.steps.map((step, index) => (
                  <div 
                    key={step.id}
                    className={`flex items-center p-3 rounded-lg border transition-all duration-300 ${
                      step.status === 'in_progress' ? 'bg-blue-50 border-blue-200 scale-105' : 
                      step.status === 'completed' ? 'bg-green-50 border-green-200' :
                      step.status === 'failed' ? 'bg-red-50 border-red-200' :
                      'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="flex-shrink-0 text-xl mr-3 w-6 text-center">
                      {getAgentIcon(step.agent)}
                    </div>
                    
                    <div className="flex-1 min-w-0 flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <h4 className="font-medium text-gray-900 capitalize whitespace-nowrap">
                          {step.agent}エージェント
                        </h4>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${getStatusColor(step.status)}`}>
                          {step.status === 'pending' ? '待機中' :
                           step.status === 'in_progress' ? '実行中' :
                           step.status === 'completed' ? '完了' : '失敗'}
                        </span>
                        <p className="text-gray-600 text-sm">
                          {step.action}
                        </p>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <div className="text-right text-xs text-gray-500 whitespace-nowrap">
                          {new Date(step.timestamp).toLocaleTimeString('ja-JP')}
                        </div>
                        {step.status === 'in_progress' && (
                          <div className="animate-pulse w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                
                {workflowState.steps.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <div className="text-4xl mb-2">⏳</div>
                    <p>エージェントが準備中...</p>
                  </div>
                )}
              </div>
            </div>

            {/* コントロールパネル */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  セッションID: {workflowState.session_id}
                </div>
                
                <div className="space-x-4">
                  {isRunning && (
                    <button
                      onClick={() => setIsRunning(false)}
                      className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                    >
                      ⏸️ 一時停止
                    </button>
                  )}
                  
                  <button
                    onClick={resetToInitialState}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    🔄 新しいレポート生成
                  </button>
                  
                  <Button variant="outline" asChild>
                    <Link href="/dashboard">
                      <FileText className="h-4 w-4 mr-2" />
                      ダッシュボード
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}