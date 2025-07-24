/**
 * Specialized Researcher Agent - Main Implementation
 * 専門分野別調査エージェントのメイン実装
 */

import {
  SpecializedResearchRequest,
  SpecializedResearchOutput,
  DomainType,
  DomainResearchResult,
  SpecializedResearcherConfig,
  SpecializedResearchError,
  ResearchItem,
  ResearchCategory
} from './types';

import {
  DEFAULT_CONFIG,
  DOMAIN_PRIORITIES,
  CATEGORY_TO_DOMAIN_MAPPING,
  EXECUTION_MESSAGES,
  VALIDATION_RULES
} from './config';

import { MarketInvestigator } from './domain-modules/market-investigator';
import { CompetitorInvestigator } from './domain-modules/competitor-investigator';
import { TechnologyInvestigator } from './domain-modules/technology-investigator';
import { RegulatoryInvestigator } from './domain-modules/regulatory-investigator';
import { FinancialInvestigator } from './domain-modules/financial-investigator';
import { DataTransformer } from './verification/data-transformer';

export class SpecializedResearcherAgent {
  private config: SpecializedResearcherConfig;
  private domainInvestigators: Map<DomainType, any>;
  private dataTransformer: DataTransformer;

  constructor(config: Partial<SpecializedResearcherConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.dataTransformer = new DataTransformer();
    
    // Initialize domain investigators
    this.domainInvestigators = new Map([
      ['market', new MarketInvestigator()],
      ['competitor', new CompetitorInvestigator()],
      ['technology', new TechnologyInvestigator()],
      ['regulatory', new RegulatoryInvestigator()],
      ['financial', new FinancialInvestigator()]
    ]);

    console.log(EXECUTION_MESSAGES.START);
    console.log(`  Execution mode: ${this.config.execution.parallel ? 'Parallel' : 'Sequential'}`);
    console.log(`  Priority domains: Market & Competitor`);
  }

  /**
   * Execute specialized research based on Enhanced Planner's output
   */
  async executeResearch(request: SpecializedResearchRequest): Promise<SpecializedResearchOutput> {
    try {
      // Validate request
      this.validateRequest(request);
      
      // Determine which domains to investigate
      const targetDomains = this.determineTargetDomains(request);
      console.log(`🎯 Target domains: ${targetDomains.join(', ')}`);
      
      // Group research items by domain
      const domainTasks = this.groupResearchItemsByDomain(
        request.researchPlan.researchItems,
        targetDomains
      );
      
      // Execute domain investigations
      const domainResults = await this.executeDomainInvestigations(domainTasks);
      
      // Transform and structure results
      const output = await this.dataTransformer.transformResults(
        request.researchPlan.id,
        request.researchPlan.businessIdeaTitle,
        domainResults
      );
      
      // Log completion
      if (output.status === 'success') {
        console.log(EXECUTION_MESSAGES.COMPLETE);
      } else if (output.status === 'partial') {
        console.log(EXECUTION_MESSAGES.PARTIAL);
      } else {
        console.log(EXECUTION_MESSAGES.FAILED);
      }
      
      return output;
      
    } catch (error) {
      console.error('❌ Specialized research failed:', error.message);
      throw new SpecializedResearchError(
        'Research execution failed',
        'EXECUTION_ERROR',
        undefined,
        { originalError: error }
      );
    }
  }

  /**
   * Validate the research request
   */
  private validateRequest(request: SpecializedResearchRequest): void {
    if (!request.researchPlan) {
      throw new SpecializedResearchError(
        'Research plan is required',
        'VALIDATION_ERROR'
      );
    }
    
    const itemCount = request.researchPlan.researchItems.length;
    if (itemCount < VALIDATION_RULES.minResearchItems) {
      throw new SpecializedResearchError(
        `At least ${VALIDATION_RULES.minResearchItems} research items required`,
        'VALIDATION_ERROR'
      );
    }
    
    if (itemCount > VALIDATION_RULES.maxResearchItems) {
      throw new SpecializedResearchError(
        `Maximum ${VALIDATION_RULES.maxResearchItems} research items allowed`,
        'VALIDATION_ERROR'
      );
    }
  }

  /**
   * Determine which domains to investigate based on request
   */
  private determineTargetDomains(request: SpecializedResearchRequest): DomainType[] {
    // If specific domains are requested, use those
    if (request.targetDomains && request.targetDomains.length > 0) {
      return request.targetDomains;
    }
    
    // Otherwise, determine from research categories
    const categories = new Set<ResearchCategory>();
    request.researchPlan.researchItems.forEach(item => {
      categories.add(item.category);
    });
    
    const domains = new Set<DomainType>();
    
    // Always include market and competitor (highest priority)
    domains.add('market');
    domains.add('competitor');
    
    // Add other domains based on categories
    categories.forEach(category => {
      const mappedDomains = CATEGORY_TO_DOMAIN_MAPPING[category] || [];
      mappedDomains.forEach(domain => domains.add(domain));
    });
    
    // Sort by priority
    return Array.from(domains).sort((a, b) => 
      (DOMAIN_PRIORITIES[b] || 0) - (DOMAIN_PRIORITIES[a] || 0)
    );
  }

  /**
   * Group research items by domain
   */
  private groupResearchItemsByDomain(
    items: ResearchItem[],
    targetDomains: DomainType[]
  ): Map<DomainType, ResearchItem[]> {
    const domainTasks = new Map<DomainType, ResearchItem[]>();
    
    // Initialize with empty arrays
    targetDomains.forEach(domain => {
      domainTasks.set(domain, []);
    });
    
    // Distribute items to appropriate domains
    items.forEach(item => {
      // Find matching domains for this category
      const matchingDomains = CATEGORY_TO_DOMAIN_MAPPING[item.category] || [];
      
      // Also check title/description for domain keywords
      const itemText = `${item.title} ${item.description}`.toLowerCase();
      
      targetDomains.forEach(domain => {
        const shouldInclude = matchingDomains.includes(domain) ||
          this.itemMatchesDomain(itemText, domain);
        
        if (shouldInclude) {
          const currentItems = domainTasks.get(domain) || [];
          currentItems.push(item);
          domainTasks.set(domain, currentItems);
        }
      });
    });
    
    // Ensure high-priority domains have items
    this.ensurePriorityDomainsHaveItems(domainTasks, items);
    
    return domainTasks;
  }

  /**
   * Check if item text matches domain keywords
   */
  private itemMatchesDomain(text: string, domain: DomainType): boolean {
    const domainKeywords: Record<DomainType, string[]> = {
      market: ['市場', '顧客', 'market', 'customer', 'segment', 'セグメント'],
      competitor: ['競合', '競争', 'competitor', 'competition', 'rival'],
      technology: ['技術', '実装', 'technology', 'technical', 'implementation'],
      regulatory: ['規制', '法', 'regulatory', 'compliance', 'law', 'ライセンス'],
      financial: ['資金', '収益', 'financial', 'funding', 'revenue', 'cost']
    };
    
    const keywords = domainKeywords[domain] || [];
    return keywords.some(keyword => text.includes(keyword));
  }

  /**
   * Ensure priority domains have at least some items
   */
  private ensurePriorityDomainsHaveItems(
    domainTasks: Map<DomainType, ResearchItem[]>,
    allItems: ResearchItem[]
  ): void {
    const priorityDomains: DomainType[] = ['market', 'competitor'];
    
    priorityDomains.forEach(domain => {
      const items = domainTasks.get(domain) || [];
      if (items.length === 0 && allItems.length > 0) {
        // Assign at least one general item to priority domains
        const generalItem: ResearchItem = {
          ...allItems[0],
          id: `${domain}_general_${allItems[0].id}`,
          title: `${domain}調査: ${allItems[0].title}`
        };
        domainTasks.set(domain, [generalItem]);
      }
    });
  }

  /**
   * Execute investigations for each domain
   */
  private async executeDomainInvestigations(
    domainTasks: Map<DomainType, ResearchItem[]>
  ): Promise<DomainResearchResult[]> {
    const results: DomainResearchResult[] = [];
    
    if (this.config.execution.parallel) {
      // Execute in parallel with concurrency limit
      const domainPromises: Promise<DomainResearchResult>[] = [];
      const domains = Array.from(domainTasks.keys());
      
      // Process in batches based on max concurrent domains
      for (let i = 0; i < domains.length; i += this.config.execution.maxConcurrentDomains) {
        const batch = domains.slice(i, i + this.config.execution.maxConcurrentDomains);
        const batchPromises = batch.map(domain => 
          this.executeSingleDomainInvestigation(domain, domainTasks.get(domain) || [])
        );
        
        const batchResults = await Promise.allSettled(batchPromises);
        
        batchResults.forEach((result, index) => {
          if (result.status === 'fulfilled') {
            results.push(result.value);
          } else if (this.config.execution.failureStrategy === 'fail_fast') {
            throw result.reason;
          } else {
            console.error(`Domain ${batch[index]} failed:`, result.reason);
          }
        });
      }
    } else {
      // Execute sequentially
      for (const [domain, items] of domainTasks) {
        try {
          const result = await this.executeSingleDomainInvestigation(domain, items);
          results.push(result);
        } catch (error) {
          if (this.config.execution.failureStrategy === 'fail_fast') {
            throw error;
          } else {
            console.error(`Domain ${domain} failed:`, error);
          }
        }
      }
    }
    
    return results;
  }

  /**
   * Execute investigation for a single domain
   */
  private async executeSingleDomainInvestigation(
    domain: DomainType,
    items: ResearchItem[]
  ): Promise<DomainResearchResult> {
    const investigator = this.domainInvestigators.get(domain);
    
    if (!investigator) {
      throw new SpecializedResearchError(
        `No investigator found for domain: ${domain}`,
        'INVESTIGATOR_NOT_FOUND',
        domain
      );
    }
    
    // Apply domain-specific configuration
    const domainConfig = this.config.domains[domain];
    
    // Execute investigation with timeout
    const timeoutMs = domainConfig.timeoutMinutes * 60 * 1000;
    const investigationPromise = investigator.investigate(items);
    
    const result = await Promise.race([
      investigationPromise,
      new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error(`Domain ${domain} timed out`)), timeoutMs)
      )
    ]);
    
    return result;
  }
}