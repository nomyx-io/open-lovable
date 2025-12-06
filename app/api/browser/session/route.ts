import { NextRequest, NextResponse } from 'next/server';
import { browserSessionManager } from '@/lib/browser';
import type { CreateSessionOptions } from '@/lib/browser';

export const dynamic = 'force-dynamic';

/**
 * POST /api/browser/session
 * Create a new browser session
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    
    const options: CreateSessionOptions = {
      sandboxId: body.sandboxId,
      initialUrl: body.initialUrl,
      viewportWidth: body.viewportWidth,
      viewportHeight: body.viewportHeight,
      headless: body.headless !== false, // Default to headless
      userAgent: body.userAgent,
    };
    
    console.log('[browser/session] Creating new session with options:', options);
    
    const sessionInfo = await browserSessionManager.createSession(options);
    
    console.log('[browser/session] Session created:', sessionInfo.sessionId);
    
    return NextResponse.json({
      success: true,
      session: sessionInfo,
    });
  } catch (error) {
    console.error('[browser/session] Error creating session:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: (error as Error).message 
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/browser/session
 * List all active browser sessions
 */
export async function GET() {
  try {
    const sessions = browserSessionManager.listSessions();
    
    return NextResponse.json({
      success: true,
      sessions,
      count: sessions.length,
    });
  } catch (error) {
    console.error('[browser/session] Error listing sessions:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: (error as Error).message 
      },
      { status: 500 }
    );
  }
}