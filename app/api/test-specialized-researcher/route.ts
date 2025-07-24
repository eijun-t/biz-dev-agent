import { NextRequest, NextResponse } from 'next/server';
import { SpecializedResearcherAgent, SpecializedResearchRequest } from '@/lib/agents/specialized-researcher';
import { ResearchPlan } from '@/lib/agents/planner/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { researchPlan } = body;

    if (!researchPlan) {
      return NextResponse.json(
        { error: 'Research plan is required' },
        { status: 400 }
      );
    }

    // Create the specialized researcher agent
    const agent = new SpecializedResearcherAgent({
      execution: {
        parallel: true,
        maxConcurrentDomains: 3,
        failureStrategy: 'continue_on_error'
      },
      output: {
        includeRawData: false,
        summaryDepth: 'detailed'
      }
    });

    // Prepare the research request
    const researchRequest: SpecializedResearchRequest = {
      researchPlan: researchPlan as ResearchPlan,
      priorityOverrides: {
        market: true,
        competitor: true
      }
    };

    // Execute the research
    console.log('🚀 Starting specialized research execution...');
    const result = await agent.executeResearch(researchRequest);
    console.log('✅ Research execution completed');

    return NextResponse.json({
      success: true,
      result
    });

  } catch (error: any) {
    console.error('❌ Specialized research error:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Research execution failed',
        details: error.details || {}
      },
      { status: 500 }
    );
  }
}