'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ResearchPlan } from '@/lib/agents/planner/types';
import { SpecializedResearchOutput } from '@/lib/agents/specialized-researcher/types';

export default function TestSpecializedResearcher() {
  const [researchPlan, setResearchPlan] = useState<string>('');
  const [result, setResult] = useState<SpecializedResearchOutput | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleExecuteResearch = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      // Parse research plan
      let planData: ResearchPlan;
      try {
        planData = JSON.parse(researchPlan);
      } catch (e) {
        throw new Error('Invalid JSON format for research plan');
      }

      const response = await fetch('/api/test-specialized-researcher', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ researchPlan: planData }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Research execution failed');
      }

      setResult(data.result);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadSamplePlan = () => {
    const sample: ResearchPlan = {
      id: 'sample_plan_001',
      businessIdeaId: 'idea_001',
      businessIdeaTitle: 'AI-Powered Business Analytics Platform',
      planCreatedAt: new Date().toISOString(),
      lastUpdatedAt: new Date().toISOString(),
      status: 'approved',
      totalEstimatedTime: 40,
      totalEstimatedCost: 500000,
      categories: {
        target_customer: {
          items: [],
          totalItems: 0,
          priorityDistribution: {
            critical: 0,
            high: 0,
            medium: 0,
            low: 0
          }
        },
        solution_technology: {
          items: [],
          totalItems: 0,
          priorityDistribution: {
            critical: 0,
            high: 0,
            medium: 0,
            low: 0
          }
        },
        market_competition: {
          items: [],
          totalItems: 0,
          priorityDistribution: {
            critical: 0,
            high: 0,
            medium: 0,
            low: 0
          }
        },
        risk_analysis: {
          items: [],
          totalItems: 0,
          priorityDistribution: {
            critical: 0,
            high: 0,
            medium: 0,
            low: 0
          }
        },
        execution_planning: {
          items: [],
          totalItems: 0,
          priorityDistribution: {
            critical: 0,
            high: 0,
            medium: 0,
            low: 0
          }
        }
      },
      researchItems: [
        {
          id: 'item_001',
          category: 'market_competition',
          title: '国内AIアナリティクス市場規模調査',
          description: '日本国内のAIを活用したビジネスアナリティクス市場の現在の規模と成長予測を調査',
          priority: 'critical',
          difficulty: 'moderate',
          estimatedTimeHours: 8,
          estimatedCost: 50000,
          methods: ['web_search', 'database_query'],
          dataSources: ['market_reports', 'industry_analysis'],
          expectedOutputs: ['市場規模データ', '成長率予測', '主要セグメント分析'],
          dependencies: [],
          keyQuestions: ['現在の市場規模は？', '年間成長率は？', '主要なセグメントは？'],
          successCriteria: ['具体的な市場規模数値の取得', '信頼できる成長予測の入手'],
          deliverables: ['市場規模レポート'],
          tags: ['market', 'analytics', 'AI']
        },
        {
          id: 'item_002',
          category: 'market_competition',
          title: '主要競合企業の分析',
          description: 'AIアナリティクス分野の主要競合企業とその製品・サービスの詳細分析',
          priority: 'critical',
          difficulty: 'moderate',
          estimatedTimeHours: 10,
          estimatedCost: 60000,
          methods: ['web_search', 'analysis'],
          dataSources: ['company_websites', 'product_databases'],
          expectedOutputs: ['競合企業リスト', '製品比較表', '価格帯分析'],
          dependencies: [],
          keyQuestions: ['主要な競合は誰か？', '彼らの強みは？', '価格戦略は？'],
          successCriteria: ['上位5社の特定', '詳細な機能比較の完成'],
          deliverables: ['競合分析レポート'],
          tags: ['competitor', 'analysis']
        },
        {
          id: 'item_003',
          category: 'solution_technology',
          title: 'AI技術スタックの調査',
          description: 'プラットフォーム構築に必要なAI・ML技術の選定と実装方法の調査',
          priority: 'high',
          difficulty: 'difficult',
          estimatedTimeHours: 12,
          estimatedCost: 80000,
          methods: ['web_search', 'analysis'],
          dataSources: ['technical_papers', 'github_repositories'],
          expectedOutputs: ['推奨技術スタック', '実装ガイドライン', 'コスト見積もり'],
          dependencies: [],
          keyQuestions: ['どの技術を使うべきか？', '実装の難易度は？', 'コストは？'],
          successCriteria: ['具体的な技術選定', '実装計画の策定'],
          deliverables: ['技術調査レポート'],
          tags: ['technology', 'AI', 'implementation']
        }
      ],
      executionTimeline: {
        phases: [
          {
            name: 'Phase 1: Market Research',
            duration: 2,
            researchItemIds: ['item_001', 'item_002']
          },
          {
            name: 'Phase 2: Technical Research',
            duration: 1,
            researchItemIds: ['item_003']
          }
        ],
        criticalPath: ['item_001', 'item_002', 'item_003'],
        milestones: [
          {
            name: 'Market Analysis Complete',
            targetDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
            deliverables: ['市場規模レポート', '競合分析レポート']
          }
        ]
      }
    };

    setResearchPlan(JSON.stringify(sample, null, 2));
  };

  return (
    <div className="container mx-auto py-8 max-w-6xl">
      <Card>
        <CardHeader>
          <CardTitle>Specialized Researcher Test</CardTitle>
          <CardDescription>
            Test the Specialized Researcher Agent with a research plan from Enhanced Planner
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-medium">Research Plan (JSON)</label>
              <Button onClick={loadSamplePlan} variant="outline" size="sm">
                Load Sample Plan
              </Button>
            </div>
            <Textarea
              placeholder="Paste your research plan JSON here..."
              value={researchPlan}
              onChange={(e) => setResearchPlan(e.target.value)}
              className="min-h-[200px] font-mono text-sm"
            />
          </div>

          <Button
            onClick={handleExecuteResearch}
            disabled={loading || !researchPlan}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Executing Specialized Research...
              </>
            ) : (
              'Execute Research'
            )}
          </Button>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {result && (
            <div className="space-y-4">
              <Alert>
                <CheckCircle2 className="h-4 w-4" />
                <AlertDescription>
                  Research completed with status: {result.status}
                </AlertDescription>
              </Alert>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Research Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <p className="font-medium text-sm text-muted-foreground">Key Findings</p>
                      <ul className="list-disc list-inside space-y-1 mt-1">
                        {result.summary.keyFindings.map((finding, idx) => (
                          <li key={idx} className="text-sm">{finding}</li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <p className="font-medium text-sm text-muted-foreground">Major Opportunities</p>
                      <ul className="list-disc list-inside space-y-1 mt-1">
                        {result.summary.majorOpportunities.map((opp, idx) => (
                          <li key={idx} className="text-sm">{opp}</li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <p className="font-medium text-sm text-muted-foreground">Critical Risks</p>
                      <ul className="list-disc list-inside space-y-1 mt-1">
                        {result.summary.criticalRisks.map((risk, idx) => (
                          <li key={idx} className="text-sm">{risk}</li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <p className="font-medium text-sm text-muted-foreground">Next Steps</p>
                      <ul className="list-disc list-inside space-y-1 mt-1">
                        {result.summary.nextSteps.map((step, idx) => (
                          <li key={idx} className="text-sm">{step}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Performance Metrics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Domains Completed</p>
                      <p className="text-lg font-semibold">{result.performance.domainsCompleted}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Data Points Collected</p>
                      <p className="text-lg font-semibold">{result.performance.dataPointsCollected}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Confidence Level</p>
                      <p className="text-lg font-semibold">
                        {(result.performance.confidence * 100).toFixed(0)}%
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Execution Time</p>
                      <p className="text-lg font-semibold">
                        {result.performance.totalTimeHours.toFixed(2)} hours
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Full Result (JSON)</CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="bg-muted p-4 rounded-lg overflow-auto max-h-96 text-xs">
                    {JSON.stringify(result, null, 2)}
                  </pre>
                </CardContent>
              </Card>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}