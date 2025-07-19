/**
 * Planner Agent - 動的な研究計画の作成
 */

import { ChatOpenAI } from '@langchain/openai';
import { 
  ResearchItem, 
  ResearchPlan, 
  ResearchCategory, 
  Region, 
  Language 
} from './types';
import { 
  RESEARCH_KEYWORDS, 
  REGION_LANGUAGE_MAP, 
  generateResearchItemId, 
  calculatePriority, 
  estimateProcessingTime,
  MITSUBISHI_CAPABILITIES
} from './utils';

export class PlannerAgent {
  private llm: ChatOpenAI;
  private parallelLimit: number;

  constructor(llm: ChatOpenAI, parallelLimit: number = 5) {
    this.llm = llm;
    this.parallelLimit = parallelLimit;
  }

  /**
   * 研究計画を生成
   */
  async generateResearchPlan(
    userInput: string = '',
    targetItemCount: number = 25
  ): Promise<ResearchPlan> {
    console.log('🎯 Planner Agent: 研究計画を生成中...');

    // 基本的な研究項目を生成
    const researchItems = await this.generateResearchItems(userInput, targetItemCount);
    
    // 優先度に基づいて並び替え
    const priorityOrder = researchItems
      .sort((a, b) => b.priority - a.priority)
      .map(item => item.id);

    // 処理時間を推定
    const totalEstimatedTime = estimateProcessingTime(researchItems.length, this.parallelLimit);

    const plan: ResearchPlan = {
      id: `plan_${Date.now()}`,
      user_input: userInput,
      research_items: researchItems,
      total_estimated_time: totalEstimatedTime,
      priority_order: priorityOrder,
      created_at: new Date().toISOString()
    };

    console.log(`📋 研究計画完成: ${researchItems.length}項目, 推定時間: ${totalEstimatedTime}秒`);
    return plan;
  }

  /**
   * 研究項目を生成
   */
  private async generateResearchItems(
    userInput: string,
    targetCount: number
  ): Promise<ResearchItem[]> {
    const items: ResearchItem[] = [];
    const categories: ResearchCategory[] = [
      'startup_trends',
      'industry_challenges', 
      'technology_developments',
      'investment_patterns'
    ];
    const regions: Region[] = ['japan', 'usa', 'global'];

    // カテゴリごとの項目数を計算
    const itemsPerCategory = Math.ceil(targetCount / categories.length);
    
    for (const category of categories) {
      for (const region of regions) {
        const regionItemCount = Math.floor(itemsPerCategory / regions.length);
        const categoryItems = await this.generateCategoryItems(
          category,
          region,
          regionItemCount,
          userInput
        );
        items.push(...categoryItems);
        
        // 目標数に達したら終了
        if (items.length >= targetCount) break;
      }
      if (items.length >= targetCount) break;
    }

    // 追加の項目が必要な場合は高優先度カテゴリから補充
    if (items.length < targetCount) {
      const additionalItems = await this.generateAdditionalItems(
        userInput,
        targetCount - items.length
      );
      items.push(...additionalItems);
    }

    return items.slice(0, targetCount);
  }

  /**
   * カテゴリ別の研究項目を生成
   */
  private async generateCategoryItems(
    category: ResearchCategory,
    region: Region,
    count: number,
    userInput: string
  ): Promise<ResearchItem[]> {
    const items: ResearchItem[] = [];
    const language = REGION_LANGUAGE_MAP[region];
    const keywords = RESEARCH_KEYWORDS[category][region] || RESEARCH_KEYWORDS[category]['global'];

    // AIを使用してトピックを生成
    const topics = await this.generateTopicsWithAI(category, region, count, userInput);

    for (let i = 0; i < Math.min(count, topics.length); i++) {
      const topic = topics[i];
      const item: ResearchItem = {
        id: generateResearchItemId(category, region, i),
        category,
        topic,
        keywords: this.selectRelevantKeywords(keywords, topic),
        region,
        language,
        priority: calculatePriority(category, region, userInput),
        estimated_effort: 15 // 秒
      };
      items.push(item);
    }

    return items;
  }

  /**
   * AIを使用してトピックを生成
   */
  private async generateTopicsWithAI(
    category: ResearchCategory,
    region: Region,
    count: number,
    userInput: string
  ): Promise<string[]> {
    const categoryDescriptions = {
      startup_trends: 'スタートアップトレンド・新興企業の動向',
      industry_challenges: '業界の課題・市場の問題点',
      technology_developments: '技術開発・イノベーション',
      investment_patterns: '投資動向・資金調達パターン'
    };

    const regionDescriptions = {
      japan: '日本市場',
      usa: 'アメリカ市場',
      global: 'グローバル市場'
    };

    const prompt = `
あなたは新事業開発の専門家です。以下の条件で${count}個の研究トピックを生成してください：

カテゴリ: ${categoryDescriptions[category]}
対象地域: ${regionDescriptions[region]}
ユーザー入力: ${userInput || '特になし'}

重要な制約条件：
- 三菱地所の既存事業領域（不動産開発、ビル管理、リーシング等）は検索対象から除外
- 三菱地所のケイパビリティと組み合わせることで新たな価値を創出できる領域を重視
- 具体的で検索可能なトピックにする
- 各トピックは異なる業界・分野をカバーする

三菱地所の主要ケイパビリティ（参考）：
${MITSUBISHI_CAPABILITIES.map(cap => `- ${cap.name}: ${cap.description}`).join('\n')}

出力形式：
1. [トピック名]
2. [トピック名]
...

各トピックは1行で、番号付きで出力してください。
`;

    try {
      const response = await this.llm.invoke(prompt);
      const content = response.content as string;
      
      // レスポンスから番号付きリストを抽出
      const lines = content.split('\n').filter(line => line.trim());
      const topics = lines
        .filter(line => /^\d+\./.test(line.trim()))
        .map(line => line.replace(/^\d+\.\s*/, '').trim())
        .filter(topic => topic.length > 0);

      return topics.slice(0, count);
    } catch (error) {
      console.error('AIトピック生成エラー:', error);
      // フォールバック：事前定義されたトピック
      return this.generateFallbackTopics(category, region, count);
    }
  }

  /**
   * フォールバック用のトピック生成
   */
  private generateFallbackTopics(
    category: ResearchCategory,
    region: Region,
    count: number
  ): string[] {
    const fallbackTopics = {
      startup_trends: {
        japan: ['フィンテック', 'ヘルステック', 'エドテック', 'アグリテック', 'モビリティ'],
        usa: ['AI startups', 'biotech', 'fintech', 'climate tech', 'web3'],
        global: ['sustainability tech', 'remote work solutions', 'digital health', 'green energy', 'food tech']
      },
      industry_challenges: {
        japan: ['労働力不足', 'DX推進', '地方創生', '高齢化対応', 'サプライチェーン'],
        usa: ['supply chain', 'cybersecurity', 'data privacy', 'workforce automation', 'infrastructure'],
        global: ['climate change', 'urbanization', 'digital divide', 'healthcare access', 'food security']
      },
      technology_developments: {
        japan: ['量子コンピューティング', 'ロボティクス', 'IoT', 'ブロックチェーン', '自動運転'],
        usa: ['machine learning', 'quantum computing', 'biotechnology', 'space technology', 'autonomous systems'],
        global: ['artificial intelligence', 'renewable energy', 'nanotechnology', 'gene editing', 'virtual reality']
      },
      investment_patterns: {
        japan: ['ベンチャー投資', 'ESG投資', 'インパクト投資', 'シリーズA', 'IPO動向'],
        usa: ['venture capital', 'growth equity', 'SPAC', 'unicorn valuations', 'exit strategies'],
        global: ['cross-border M&A', 'sovereign wealth funds', 'impact investing', 'green bonds', 'crypto investments']
      }
    };

    const topics = fallbackTopics[category][region] || fallbackTopics[category]['global'];
    return topics.slice(0, count);
  }

  /**
   * 関連するキーワードを選択
   */
  private selectRelevantKeywords(keywords: string[], topic: string): string[] {
    const topicLower = topic.toLowerCase();
    const relevant = keywords.filter(keyword => 
      topicLower.includes(keyword.toLowerCase()) || 
      keyword.toLowerCase().includes(topicLower)
    );
    
    // 関連するキーワードが少ない場合は、基本キーワードを追加
    if (relevant.length < 3) {
      const additional = keywords.filter(keyword => !relevant.includes(keyword));
      relevant.push(...additional.slice(0, 3 - relevant.length));
    }

    return relevant.slice(0, 5); // 最大5個のキーワード
  }

  /**
   * 追加の研究項目を生成
   */
  private async generateAdditionalItems(
    userInput: string,
    count: number
  ): Promise<ResearchItem[]> {
    const items: ResearchItem[] = [];
    const highPriorityCategories: ResearchCategory[] = ['industry_challenges', 'startup_trends'];
    const highPriorityRegions: Region[] = ['japan', 'usa'];

    for (const category of highPriorityCategories) {
      for (const region of highPriorityRegions) {
        if (items.length >= count) break;
        
        const categoryItems = await this.generateCategoryItems(
          category,
          region,
          Math.ceil(count / 4),
          userInput
        );
        items.push(...categoryItems);
      }
      if (items.length >= count) break;
    }

    return items.slice(0, count);
  }

  /**
   * 研究計画の品質を評価
   */
  evaluatePlanQuality(plan: ResearchPlan): {
    score: number;
    feedback: string[];
    recommendations: string[];
  } {
    const feedback: string[] = [];
    const recommendations: string[] = [];
    let score = 10;

    // カテゴリバランスを評価
    const categoryCount = plan.research_items.reduce((acc, item) => {
      acc[item.category] = (acc[item.category] || 0) + 1;
      return acc;
    }, {} as Record<ResearchCategory, number>);

    const categories = Object.keys(categoryCount);
    if (categories.length < 4) {
      score -= 2;
      feedback.push('一部のカテゴリが不足しています');
      recommendations.push('全カテゴリを均等にカバーしてください');
    }

    // 地域バランスを評価
    const regionCount = plan.research_items.reduce((acc, item) => {
      acc[item.region] = (acc[item.region] || 0) + 1;
      return acc;
    }, {} as Record<Region, number>);

    const japanRatio = (regionCount.japan || 0) / plan.research_items.length;
    if (japanRatio < 0.3) {
      score -= 1;
      feedback.push('日本市場の調査項目が少ない可能性があります');
      recommendations.push('日本市場の調査を強化してください');
    }

    // 処理時間を評価
    if (plan.total_estimated_time > 180) {
      score -= 1;
      feedback.push('処理時間が長すぎる可能性があります');
      recommendations.push('並列処理の最適化を検討してください');
    }

    return {
      score: Math.max(0, score),
      feedback,
      recommendations
    };
  }
}