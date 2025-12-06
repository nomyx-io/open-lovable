import { NextRequest, NextResponse } from 'next/server';
import { browserSessionManager } from '@/lib/browser';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/browser/session/[id]
 * Get information about a specific browser session
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id: sessionId } = await params;
    
    const sessionInfo = browserSessionManager.getSessionInfoById(sessionId);
    
    if (!sessionInfo) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Session not found' 
        },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      session: sessionInfo,
    });
  } catch (error) {
    console.error('[browser/session/[id]] Error getting session:', error);
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
 * DELETE /api/browser/session/[id]
 * Close a specific browser session
 */
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id: sessionId } = await params;
    
    console.log('[browser/session/[id]] Closing session:', sessionId);
    
    const closed = await browserSessionManager.closeSession(sessionId);
    
    if (!closed) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Session not found or already closed' 
        },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'Session closed successfully',
    });
  } catch (error) {
    console.error('[browser/session/[id]] Error closing session:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: (error as Error).message 
      },
      { status: 500 }
    );
  }
}