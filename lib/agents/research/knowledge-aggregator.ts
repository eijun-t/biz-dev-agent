/**
 * Knowledge Aggregator for Enhanced Researcher Agent
 * ナレッジベース集約・構造化・出力機能
 */

import { 
  KnowledgeBase, 
  CategorySummary, 
  DataCollectionResult, 
  ResearchCategory, 
  QualityLevel,
  ModuleExecutionResult,
  Language
} from './enhanced-researcher-types';
import { MITSUBISHI_SYNERGY_KEYWORDS } from './enhanced-researcher-config';
import { createChatOpenAI } from '@/lib/config/llm-config';

// 重複検出結果
interface DuplicationAnalysis {
  duplicateGroups: Array<{
    representative: DataCollectionResult;
    duplicates: DataCollectionResult[];
    similarityScore: number;
  }>;
  uniqueResults: DataCollectionResult[];
  totalOriginal: number;
  totalAfterDeduplication: number;
  deduplicationRate: number;
}

// クロスカテゴリ洞察
interface CrossCategoryInsight {
  categories: ResearchCategory[];
  insight: string;
  confidence: QualityLevel;
  supportingEvidence: string[];
  businessRelevance: number; // 1-10
}

export class KnowledgeAggregator {
  private llm: any;

  constructor() {
    this.llm = createChatOpenAI('researcher');
  }

  /**
   * 包括的ナレッジベースを生成
   */
  async generateKnowledgeBase(
    requestId: string,
    userInput: string,
    moduleResults: ModuleExecutionResult[],
    language: Language = 'ja'
  ): Promise<KnowledgeBase> {
    const startTime = Date.now();
    
    console.log('🧠 Knowledge aggregation started...');

    try {
      // 1. データの重複排除
      const deduplicatedResults = await this.deduplicateResults(moduleResults);
      
      // 2. カテゴリ別サマリー生成
      const categorySummaries = await this.generateCategorySummaries(
        moduleResults, 
        deduplicatedResults, 
        language
      );

      // 3. クロスカテゴリ洞察分析
      const crossCategoryInsights = await this.analyzeCrossCategoryInsights(
        categorySummaries, 
        language
      );

      // 4. 全体的なビジネス評価
      const businessAssessment = await this.assessOverallBusinessPotential(
        categorySummaries,
        crossCategoryInsights,
        userInput,
        language
      );

      // 5. 情報ギャップ分析
      const informationGaps = this.identifyInformationGaps(categorySummaries);

      // 6. 推奨事項生成
      const priorityRecommendations = await this.generatePriorityRecommendations(
        businessAssessment,
        categorySummaries,
        language
      );

      const totalDataPoints = deduplicatedResults.reduce((sum, results) => sum + results.length, 0);
      const averageQuality = this.calculateAverageQuality(deduplicatedResults);
      const totalCost = moduleResults.reduce((sum, result) => sum + result.cost, 0);

      const knowledgeBase: KnowledgeBase = {
        requestId,
        userInput,
        categorySummaries,
        crossCategoryInsights: crossCategoryInsights.map(insight => insight.insight),
        overallBusinessPotential: businessAssessment.overallScore,
        mitsubishiStrategicFit: businessAssessment.mitsubishiFit,
        marketSizeEstimate: businessAssessment.marketSize,
        implementationComplexity: businessAssessment.complexity,
        timeToMarket: businessAssessment.timeToMarket,
        keyRisks: businessAssessment.keyRisks,
        keyOpportunities: businessAssessment.keyOpportunities,
        priorityRecommendations,
        informationGaps,
        totalDataPoints,
        averageDataQuality: averageQuality,
        costIncurred: totalCost,
        executionTime: (Date.now() - startTime) / 1000,
        createdAt: new Date().toISOString()
      };

      console.log(`✅ Knowledge base generated: ${totalDataPoints} data points, quality ${averageQuality.toFixed(1)}/10`);

      return knowledgeBase;

    } catch (error) {
      console.error('Knowledge aggregation failed:', error);
      throw error;
    }
  }

  /**
   * データの重複排除
   */
  private async deduplicateResults(moduleResults: ModuleExecutionResult[]): Promise<DataCollectionResult[][]> {
    const deduplicatedByCategory: DataCollectionResult[][] = [];

    for (const moduleResult of moduleResults) {
      if (!moduleResult.success || !moduleResult.results.length) {
        deduplicatedByCategory.push([]);
        continue;
      }

      const duplicationAnalysis = this.analyzeDuplication(moduleResult.results);
      const uniqueResults = [
        ...duplicationAnalysis.uniqueResults,
        ...duplicationAnalysis.duplicateGroups.map(group => group.representative)
      ];

      deduplicatedByCategory.push(uniqueResults);

      console.log(`Deduplication for ${moduleResult.module}: ${moduleResult.results.length} → ${uniqueResults.length} (${duplicationAnalysis.deduplicationRate.toFixed(1)}% reduction)`);
    }

    return deduplicatedByCategory;
  }

  /**
   * 重複分析
   */
  private analyzeDuplication(results: DataCollectionResult[]): DuplicationAnalysis {
    const duplicateGroups: Array<{
      representative: DataCollectionResult;
      duplicates: DataCollectionResult[];
      similarityScore: number;
    }> = [];
    
    const processed = new Set<string>();
    const uniqueResults: DataCollectionResult[] = [];

    for (let i = 0; i < results.length; i++) {
      if (processed.has(results[i].id)) continue;

      const currentResult = results[i];
      const duplicates: DataCollectionResult[] = [];

      // 他の結果との類似度をチェック
      for (let j = i + 1; j < results.length; j++) {
        if (processed.has(results[j].id)) continue;

        const similarity = this.calculateSimilarity(currentResult, results[j]);
        
        if (similarity > 0.8) { // 80%以上の類似度
          duplicates.push(results[j]);
          processed.add(results[j].id);
        }
      }

      if (duplicates.length > 0) {
        duplicateGroups.push({
          representative: currentResult,
          duplicates,
          similarityScore: duplicates.length > 0 ? 
            duplicates.reduce((sum, dup) => sum + this.calculateSimilarity(currentResult, dup), 0) / duplicates.length : 0
        });
      } else {
        uniqueResults.push(currentResult);
      }

      processed.add(currentResult.id);
    }

    return {
      duplicateGroups,
      uniqueResults,
      totalOriginal: results.length,
      totalAfterDeduplication: uniqueResults.length + duplicateGroups.length,
      deduplicationRate: results.length > 0 ? 
        ((results.length - (uniqueResults.length + duplicateGroups.length)) / results.length) * 100 : 0
    };
  }

  /**
   * 類似度計算（タイトルとコンテンツの重複度）
   */
  private calculateSimilarity(result1: DataCollectionResult, result2: DataCollectionResult): number {
    const title1 = result1.title.toLowerCase();
    const title2 = result2.title.toLowerCase();
    const content1 = result1.content.toLowerCase();
    const content2 = result2.content.toLowerCase();

    // Jaccard類似度を使用
    const titleSimilarity = this.jaccardSimilarity(title1, title2);
    const contentSimilarity = this.jaccardSimilarity(content1, content2);
    
    // URLが同じ場合は高い類似度
    if (result1.url && result2.url && result1.url === result2.url) {
      return 0.95;
    }

    // タイトルの重みを高く設定
    return (titleSimilarity * 0.7) + (contentSimilarity * 0.3);
  }

  /**
   * Jaccard類似度計算
   */
  private jaccardSimilarity(text1: string, text2: string): number {
    const words1 = new Set(text1.split(/\s+/));
    const words2 = new Set(text2.split(/\s+/));
    
    const intersection = new Set([...words1].filter(word => words2.has(word)));
    const union = new Set([...words1, ...words2]);
    
    return union.size > 0 ? intersection.size / union.size : 0;
  }

  /**
   * カテゴリ別サマリー生成
   */
  private async generateCategorySummaries(
    moduleResults: ModuleExecutionResult[],
    deduplicatedResults: DataCollectionResult[][],
    language: Language
  ): Promise<CategorySummary[]> {
    const categorySummaries: CategorySummary[] = [];

    for (let i = 0; i < moduleResults.length; i++) {
      const moduleResult = moduleResults[i];
      const results = deduplicatedResults[i];

      if (!moduleResult.success || results.length === 0) {
        // 失敗またはデータなしの場合のデフォルトサマリー
        categorySummaries.push(this.createDefaultCategorySummary(moduleResult.module));
        continue;
      }

      try {
        const summary = await this.generateAIBasedSummary(
          moduleResult.module,
          results,
          language
        );
        categorySummaries.push(summary);
      } catch (error) {
        console.error(`Failed to generate summary for ${moduleResult.module}:`, error);
        categorySummaries.push(this.createDefaultCategorySummary(moduleResult.module));
      }
    }

    return categorySummaries;
  }

  /**
   * AI基盤のサマリー生成
   */
  private async generateAIBasedSummary(
    category: ResearchCategory,
    results: DataCollectionResult[],
    language: Language
  ): Promise<CategorySummary> {
    const prompt = language === 'ja' ? this.generateJapaneseSummaryPrompt(category, results) 
                                    : this.generateEnglishSummaryPrompt(category, results);

    const response = await this.llm.invoke(prompt);
    const aiSummary = this.parseSummaryResponse(response.content, category);

    // データソース内訳を計算
    const dataSourceBreakdown = results.reduce((breakdown, result) => {
      breakdown[result.sourceType] = (breakdown[result.sourceType] || 0) + 1;
      return breakdown;
    }, {} as Record<string, number>);

    return {
      category,
      totalResults: results.length,
      averageQuality: this.calculateAverageQualityForResults(results),
      keyFindings: aiSummary.keyFindings || [],
      trendAnalysis: aiSummary.trendAnalysis || '',
      businessRelevance: aiSummary.businessRelevance || 5,
      mitsubishiSynergy: this.calculateMitsubishiSynergy(results),
      riskFactors: aiSummary.riskFactors || [],
      opportunities: aiSummary.opportunities || [],
      dataSourceBreakdown: dataSourceBreakdown as any,
      confidence: this.assessConfidenceLevel(results),
      lastUpdated: new Date().toISOString()
    };
  }

  /**
   * 日本語サマリープロンプト生成
   */
  private generateJapaneseSummaryPrompt(category: ResearchCategory, results: DataCollectionResult[]): string {
    const categoryNames = {
      market_trends: '市場動向・規模',
      technology: '新興技術・イノベーション',
      investment: '投資・資金調達',
      regulation: '規制・政策',
      consumer_behavior: '消費者行動・ニーズ',
      competition: '競合動向・M&A',
      macroeconomics: 'マクロ経済要因'
    };

    const dataOverview = results.slice(0, 10).map((result, index) => 
      `${index + 1}. ${result.title}\n   ${result.summary}`
    ).join('\n\n');

    return `
以下の${categoryNames[category]}に関する調査データを分析し、構造化されたサマリーを作成してください。

調査データ:
${dataOverview}

以下のJSON形式で回答してください：

{
  "keyFindings": [
    "重要な発見1",
    "重要な発見2", 
    "重要な発見3"
  ],
  "trendAnalysis": "トレンド分析の詳細説明（200-300文字）",
  "businessRelevance": 8,
  "riskFactors": [
    "リスク要因1",
    "リスク要因2"
  ],
  "opportunities": [
    "機会1",
    "機会2",
    "機会3"
  ]
}

重要な要件：
- keyFindingsは最も重要な洞察を3-5個
- trendAnalysisは現在のトレンドと将来の方向性を包含
- businessRelevanceは1-10のスコア（新規事業開発の観点から）
- riskFactorsとopportunitiesは具体的で実行可能な内容
`;
  }

  /**
   * 英語サマリープロンプト生成
   */
  private generateEnglishSummaryPrompt(category: ResearchCategory, results: DataCollectionResult[]): string {
    // 英語版は省略（基本的に日本語版と同じ構造）
    return this.generateJapaneseSummaryPrompt(category, results);
  }

  /**
   * サマリーレスポンスをパース
   */
  private parseSummaryResponse(response: string, category: ResearchCategory): {
    keyFindings?: string[];
    trendAnalysis?: string;
    businessRelevance?: number;
    riskFactors?: string[];
    opportunities?: string[];
  } {
    try {
      // JSONブロックを抽出
      const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/) || response.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        return JSON.parse(jsonMatch[1] || jsonMatch[0]);
      }
      
      // JSONパースに失敗した場合のフォールバック
      return this.extractSummaryFromText(response);
    } catch (error) {
      console.error('Failed to parse summary response:', error);
      return {};
    }
  }

  /**
   * テキストからサマリーを抽出（フォールバック）
   */
  private extractSummaryFromText(text: string): {
    keyFindings?: string[];
    trendAnalysis?: string;
    businessRelevance?: number;
    riskFactors?: string[];
    opportunities?: string[];
  } {
    const result: any = {};

    // キーファインディングを抽出
    const findingsMatch = text.match(/重要な発見|key.*finding|主要.*発見/i);
    if (findingsMatch) {
      const findingsSection = text.substring(findingsMatch.index!);
      const findings = findingsSection.match(/\d+\.\s*([^\n]+)/g);
      if (findings) {
        result.keyFindings = findings.map(f => f.replace(/^\d+\.\s*/, '').trim()).slice(0, 5);
      }
    }

    // ビジネス関連性スコアを抽出
    const scoreMatch = text.match(/(\d+)(?:点|\/10|out of 10)/);
    if (scoreMatch) {
      result.businessRelevance = parseInt(scoreMatch[1]);
    }

    return result;
  }

  /**
   * クロスカテゴリ洞察分析
   */
  private async analyzeCrossCategoryInsights(
    categorySummaries: CategorySummary[],
    language: Language
  ): Promise<CrossCategoryInsight[]> {
    const insights: CrossCategoryInsight[] = [];

    try {
      const prompt = this.generateCrossAnalysisPrompt(categorySummaries, language);
      const response = await this.llm.invoke(prompt);
      
      // レスポンスをパースして洞察を抽出
      const extractedInsights = this.extractCrossInsights(response.content);
      insights.push(...extractedInsights);

    } catch (error) {
      console.error('Cross-category analysis failed:', error);
    }

    return insights;
  }

  /**
   * クロス分析プロンプト生成
   */
  private generateCrossAnalysisPrompt(categorySummaries: CategorySummary[], language: Language): string {
    const summaryText = categorySummaries.map(summary => 
      `${summary.category}: ${summary.trendAnalysis}\n主要発見: ${summary.keyFindings.join(', ')}`
    ).join('\n\n');

    return `
以下の各カテゴリの調査サマリーを分析し、カテゴリ間の関連性や相互作用から生まれる洞察を特定してください。

調査サマリー:
${summaryText}

以下の観点でクロスカテゴリ洞察を分析してください：
1. 複数カテゴリにまたがるトレンドや変化
2. 一つのカテゴリの変化が他に与える影響
3. カテゴリ間の矛盾や対立する傾向
4. 統合的なビジネス機会

各洞察について、以下の形式で3-5個の洞察を提供してください：

洞察1: [カテゴリ間の関連性についての具体的な洞察]
根拠: [この洞察を支持する証拠]
ビジネス関連性: [1-10のスコア]

洞察2: [次の洞察]
...
`;
  }

  /**
   * クロス洞察を抽出
   */
  private extractCrossInsights(response: string): CrossCategoryInsight[] {
    const insights: CrossCategoryInsight[] = [];
    
    // 簡単なパターンマッチングで洞察を抽出
    const insightPattern = /洞察\d+:\s*([^\n]+)\n根拠:\s*([^\n]+)\nビジネス関連性:\s*(\d+)/g;
    let match;

    while ((match = insightPattern.exec(response)) !== null) {
      insights.push({
        categories: ['market_trends', 'technology'], // 簡略化
        insight: match[1],
        confidence: 'medium',
        supportingEvidence: [match[2]],
        businessRelevance: parseInt(match[3]) || 5
      });
    }

    return insights;
  }

  /**
   * 全体的なビジネス評価
   */
  private async assessOverallBusinessPotential(
    categorySummaries: CategorySummary[],
    crossCategoryInsights: CrossCategoryInsight[],
    userInput: string,
    language: Language
  ): Promise<{
    overallScore: number;
    mitsubishiFit: number;
    marketSize: string;
    complexity: QualityLevel;
    timeToMarket: string;
    keyRisks: string[];
    keyOpportunities: string[];
  }> {
    // 各カテゴリのビジネス関連性から全体スコアを算出
    const categoryScores = categorySummaries.map(s => s.businessRelevance);
    const overallScore = categoryScores.length > 0 ? 
      categoryScores.reduce((sum, score) => sum + score, 0) / categoryScores.length : 5;

    // 三菱地所適合性の平均
    const mitsubishiFit = categorySummaries.length > 0 ?
      categorySummaries.reduce((sum, s) => sum + s.mitsubishiSynergy, 0) / categorySummaries.length : 5;

    // リスクと機会を集約
    const allRisks = categorySummaries.flatMap(s => s.riskFactors);
    const allOpportunities = categorySummaries.flatMap(s => s.opportunities);

    // 市場規模推定（市場動向カテゴリから）
    const marketTrendsSummary = categorySummaries.find(s => s.category === 'market_trends');
    let marketSize = '中規模';
    
    if (marketTrendsSummary) {
      if (marketTrendsSummary.businessRelevance >= 8) marketSize = '大規模';
      else if (marketTrendsSummary.businessRelevance <= 4) marketSize = '小規模';
    }

    // 実装複雑性評価
    const techSummary = categorySummaries.find(s => s.category === 'technology');
    const regSummary = categorySummaries.find(s => s.category === 'regulation');
    
    let complexity: QualityLevel = 'medium';
    if (techSummary?.confidence === 'low' || regSummary?.riskFactors.length > 3) {
      complexity = 'high';
    } else if (techSummary?.confidence === 'high' && regSummary?.riskFactors.length <= 1) {
      complexity = 'low';
    }

    return {
      overallScore: Math.round(overallScore * 10) / 10,
      mitsubishiFit: Math.round(mitsubishiFit * 10) / 10,
      marketSize,
      complexity,
      timeToMarket: this.estimateTimeToMarket(complexity, overallScore),
      keyRisks: allRisks.slice(0, 5),
      keyOpportunities: allOpportunities.slice(0, 5)
    };
  }

  /**
   * 市場参入時期推定
   */
  private estimateTimeToMarket(complexity: QualityLevel, businessScore: number): string {
    if (complexity === 'high') return '3-5年';
    if (complexity === 'low' && businessScore >= 7) return '6ヶ月-1年';
    return '1-2年';
  }

  /**
   * 情報ギャップ分析
   */
  private identifyInformationGaps(categorySummaries: CategorySummary[]): string[] {
    const gaps: string[] = [];

    categorySummaries.forEach(summary => {
      if (summary.totalResults < 3) {
        gaps.push(`${summary.category}の情報が不足しています（${summary.totalResults}件のみ）`);
      }
      
      if (summary.averageQuality < 6) {
        gaps.push(`${summary.category}の情報品質が低下しています（平均${summary.averageQuality.toFixed(1)}/10）`);
      }
      
      if (summary.confidence === 'low') {
        gaps.push(`${summary.category}の分析信頼度が低い状況です`);
      }
    });

    return gaps;
  }

  /**
   * 優先推奨事項生成
   */
  private async generatePriorityRecommendations(
    businessAssessment: any,
    categorySummaries: CategorySummary[],
    language: Language
  ): Promise<string[]> {
    const recommendations: string[] = [];

    // ビジネス評価に基づく推奨事項
    if (businessAssessment.overallScore >= 7) {
      recommendations.push('高いビジネス潜在性が確認されており、積極的な事業検討を推奨します');
    }

    if (businessAssessment.mitsubishiFit >= 7) {
      recommendations.push('三菱地所の既存アセットとの高いシナジー効果が期待できます');
    }

    if (businessAssessment.complexity === 'low') {
      recommendations.push('実装複雑性が低く、迅速な市場参入が可能です');
    }

    // カテゴリ別の推奨事項
    const highValueCategories = categorySummaries
      .filter(s => s.businessRelevance >= 7)
      .map(s => s.category);

    if (highValueCategories.length > 0) {
      recommendations.push(`特に${highValueCategories.join('、')}の領域で高い事業価値が見込まれます`);
    }

    return recommendations.slice(0, 5);
  }

  /**
   * 三菱地所シナジー計算
   */
  private calculateMitsubishiSynergy(results: DataCollectionResult[]): number {
    let synergyScore = 0;
    let totalContent = '';

    results.forEach(result => {
      totalContent += result.title + ' ' + result.content;
    });

    const contentLower = totalContent.toLowerCase();
    
    // 日本語キーワードマッチング
    MITSUBISHI_SYNERGY_KEYWORDS.ja.forEach(keyword => {
      if (contentLower.includes(keyword)) {
        synergyScore += 0.5;
      }
    });

    // 英語キーワードマッチング
    MITSUBISHI_SYNERGY_KEYWORDS.en.forEach(keyword => {
      if (contentLower.includes(keyword)) {
        synergyScore += 0.5;
      }
    });

    return Math.min(Math.round(synergyScore), 10);
  }

  /**
   * 信頼度レベル評価
   */
  private assessConfidenceLevel(results: DataCollectionResult[]): QualityLevel {
    if (results.length < 3) return 'low';
    
    const avgQuality = this.calculateAverageQualityForResults(results);
    
    if (avgQuality >= 7) return 'high';
    if (avgQuality >= 5) return 'medium';
    return 'low';
  }

  /**
   * 結果の平均品質計算
   */
  private calculateAverageQualityForResults(results: DataCollectionResult[]): number {
    if (results.length === 0) return 0;
    
    const totalQuality = results.reduce((sum, result) => sum + result.qualityScore, 0);
    return totalQuality / results.length;
  }

  /**
   * 全体の平均品質計算
   */
  private calculateAverageQuality(deduplicatedResults: DataCollectionResult[][]): number {
    const allResults = deduplicatedResults.flat();
    return this.calculateAverageQualityForResults(allResults);
  }

  /**
   * デフォルトカテゴリサマリー作成
   */
  private createDefaultCategorySummary(category: ResearchCategory): CategorySummary {
    return {
      category,
      totalResults: 0,
      averageQuality: 0,
      keyFindings: [`${category}の情報収集に失敗しました`],
      trendAnalysis: 'データが不足しており、分析できませんでした',
      businessRelevance: 0,
      mitsubishiSynergy: 0,
      riskFactors: ['情報不足によるリスク評価困難'],
      opportunities: [],
      dataSourceBreakdown: {} as any,
      confidence: 'low',
      lastUpdated: new Date().toISOString()
    };
  }
}