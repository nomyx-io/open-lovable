import { NextRequest, NextResponse } from 'next/server';
import { browserToolExecutor } from '@/lib/browser';

export const dynamic = 'force-dynamic';

/**
 * POST /api/browser/execute-tool
 * Execute browser tool calls from AI response content
 * 
 * This endpoint parses browser_test tags from AI content and executes them sequentially.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { content, sandboxUrl, sessionId } = body;
    
    if (!content) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Content is required' 
        },
        { status: 400 }
      );
    }
    
    console.log('[browser/execute-tool] Parsing browser tool calls from content');
    
    // Set active session if provided
    if (sessionId) {
      browserToolExecutor.setActiveSessionId(sessionId);
    }
    
    // Execute all tool calls
    const { toolCalls, results, screenshots } = await browserToolExecutor.executeAllToolCalls(
      content,
      sandboxUrl
    );
    
    if (toolCalls.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No browser tool calls found in content',
        toolCalls: [],
        results: [],
        screenshots: [],
      });
    }
    
    console.log(`[browser/execute-tool] Executed ${toolCalls.length} tool calls`);
    
    // Compile formatted responses
    const formattedResponses = results.map(r => r.formattedResponse);
    
    // Get current session info
    const sessionInfo = browserToolExecutor.getActiveSessionInfo();
    
    return NextResponse.json({
      success: true,
      toolCalls: toolCalls.map(tc => ({
        action: tc.action,
        params: tc.params,
      })),
      results: results.map(r => ({
        success: r.success,
        action: r.action,
        duration: r.result.duration,
        error: r.result.error,
        pageInfo: r.result.pageInfo,
        consoleLogCount: r.result.consoleLogs.length,
        consoleLogs: r.result.consoleLogs,
      })),
      screenshots,
      formattedResponses,
      sessionId: browserToolExecutor.getActiveSessionId(),
      session: sessionInfo,
    });
  } catch (error) {
    console.error('[browser/execute-tool] Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: (error as Error).message 
      },
      { status: 500 }
    );
  }
}