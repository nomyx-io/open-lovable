import { NextRequest, NextResponse } from 'next/server';
import { browserSessionManager } from '@/lib/browser';

export const dynamic = 'force-dynamic';

/**
 * GET /api/browser/console
 * Get console logs for a browser session
 * 
 * Query params:
 * - sessionId: The session ID (required)
 * - since: Timestamp to filter logs after (optional)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const sessionId = searchParams.get('sessionId');
    const since = searchParams.get('since');
    
    if (!sessionId) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Session ID is required' 
        },
        { status: 400 }
      );
    }
    
    const sinceTimestamp = since ? parseInt(since, 10) : undefined;
    
    const logs = browserSessionManager.getConsoleLogs(sessionId, sinceTimestamp);
    
    return NextResponse.json({
      success: true,
      logs,
      count: logs.length,
    });
  } catch (error) {
    console.error('[browser/console] Error getting console logs:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: (error as Error).message 
      },
      { status: 500 }
    );
  }
}