/**
 * Analyze Project Requirements API
 * 
 * This endpoint analyzes user requirements and returns template/project type
 * recommendations, along with any clarifying questions if the requirements
 * are ambiguous.
 */

import { NextRequest, NextResponse } from 'next/server';
import { analyzeProjectRequirements, refineProjectSelection } from '@/lib/projects/template-selector';
import type { ClarifyingOption } from '@/lib/projects/template-selector';

export interface AnalyzeRequest {
  /** User's project description/requirements */
  userInput: string;
  /** Previous selection result (for refinement after answering questions) */
  previousResult?: {
    isConfident: boolean;
    confidence: number;
    projectType: string;
    reasoning: string;
    clarifyingQuestions?: Array<{
      question: string;
      options: ClarifyingOption[];
      priority: number;
    }>;
  };
  /** User's answer to a clarifying question */
  answer?: {
    questionValue: string;
    option: ClarifyingOption;
  };
}

export interface AnalyzeResponse {
  success: boolean;
  result?: {
    isConfident: boolean;
    confidence: number;
    projectType: string;
    projectTypeName: string;
    template: {
      id: string;
      name: string;
      description: string;
      category: string;
    } | null;
    reasoning: string;
    clarifyingQuestions?: Array<{
      question: string;
      options: Array<{
        label: string;
        value: string;
        projectTypeHint?: string;
        templateCategoryHint?: string;
      }>;
      priority: number;
    }>;
    alternatives?: Array<{
      projectType: string;
      reason: string;
    }>;
  };
  error?: string;
}

const PROJECT_TYPE_NAMES: Record<string, string> = {
  'vite-react': 'Vite + React',
  'nextjs-app': 'Next.js (App Router)',
  'nextjs-pages': 'Next.js (Pages Router)',
  'astro': 'Astro',
  'expo': 'Expo (React Native)',
};

export async function POST(request: NextRequest): Promise<NextResponse<AnalyzeResponse>> {
  try {
    const body: AnalyzeRequest = await request.json();
    
    if (!body.userInput || typeof body.userInput !== 'string') {
      return NextResponse.json({
        success: false,
        error: 'userInput is required and must be a string',
      }, { status: 400 });
    }

    let result;

    // If we have a previous result and an answer, refine the selection
    if (body.previousResult && body.answer) {
      // Reconstruct the previous result
      const previousResult = {
        ...body.previousResult,
        projectType: body.previousResult.projectType as any,
        template: null, // Will be recalculated
      };
      
      result = refineProjectSelection(
        previousResult as any,
        body.answer.questionValue,
        body.answer.option
      );
    } else {
      // Initial analysis
      result = analyzeProjectRequirements(body.userInput);
    }

    // Format response
    const response: AnalyzeResponse = {
      success: true,
      result: {
        isConfident: result.isConfident,
        confidence: result.confidence,
        projectType: result.projectType,
        projectTypeName: PROJECT_TYPE_NAMES[result.projectType] || result.projectType,
        template: result.template ? {
          id: result.template.id,
          name: result.template.name,
          description: result.template.description,
          category: result.template.category,
        } : null,
        reasoning: result.reasoning,
        clarifyingQuestions: result.clarifyingQuestions,
        alternatives: result.alternatives?.map(alt => ({
          projectType: alt.projectType,
          reason: alt.reason,
        })),
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('[analyze-project-requirements] Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    }, { status: 500 });
  }
}

// Also support GET for simple queries
export async function GET(request: NextRequest): Promise<NextResponse<AnalyzeResponse>> {
  const searchParams = request.nextUrl.searchParams;
  const userInput = searchParams.get('q') || searchParams.get('query');

  if (!userInput) {
    return NextResponse.json({
      success: false,
      error: 'Query parameter "q" or "query" is required',
    }, { status: 400 });
  }

  const result = analyzeProjectRequirements(userInput);

  return NextResponse.json({
    success: true,
    result: {
      isConfident: result.isConfident,
      confidence: result.confidence,
      projectType: result.projectType,
      projectTypeName: PROJECT_TYPE_NAMES[result.projectType] || result.projectType,
      template: result.template ? {
        id: result.template.id,
        name: result.template.name,
        description: result.template.description,
        category: result.template.category,
      } : null,
      reasoning: result.reasoning,
      clarifyingQuestions: result.clarifyingQuestions,
      alternatives: result.alternatives?.map(alt => ({
        projectType: alt.projectType,
        reason: alt.reason,
      })),
    },
  });
}