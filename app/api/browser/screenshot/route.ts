import { NextRequest, NextResponse } from 'next/server';
import { browserSessionManager } from '@/lib/browser';

export const dynamic = 'force-dynamic';

/**
 * POST /api/browser/screenshot
 * Take a screenshot of the current page state
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, fullPage } = body;
    
    if (!sessionId) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Session ID is required' 
        },
        { status: 400 }
      );
    }
    
    console.log(`[browser/screenshot] Taking screenshot for session ${sessionId}`);
    
    const screenshot = await browserSessionManager.takeScreenshot(sessionId, { fullPage });
    
    if (!screenshot) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to take screenshot or session not found' 
        },
        { status: 404 }
      );
    }
    
    // Also get session info for context
    const sessionInfo = browserSessionManager.getSessionInfoById(sessionId);
    
    return NextResponse.json({
      success: true,
      screenshot,
      pageInfo: sessionInfo ? {
        url: sessionInfo.currentUrl,
        title: sessionInfo.currentTitle,
      } : null,
    });
  } catch (error) {
    console.error('[browser/screenshot] Error taking screenshot:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: (error as Error).message 
      },
      { status: 500 }
    );
  }
}