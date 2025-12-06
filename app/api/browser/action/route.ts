import { NextRequest, NextResponse } from 'next/server';
import { browserSessionManager } from '@/lib/browser';
import type { BrowserAction, BrowserActionType } from '@/lib/browser';

export const dynamic = 'force-dynamic';

/**
 * Valid action types that can be executed
 */
const VALID_ACTIONS: BrowserActionType[] = [
  'navigate',
  'click',
  'type',
  'screenshot',
  'scroll',
  'wait',
  'evaluate',
  'hover',
  'select',
  'clear',
  'goBack',
  'goForward',
  'refresh',
];

/**
 * POST /api/browser/action
 * Execute a browser action on a session
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const { sessionId, action, params } = body;
    
    // Validate session ID
    if (!sessionId) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Session ID is required' 
        },
        { status: 400 }
      );
    }
    
    // Validate action type
    if (!action || !VALID_ACTIONS.includes(action)) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Invalid action type. Valid actions: ${VALID_ACTIONS.join(', ')}` 
        },
        { status: 400 }
      );
    }
    
    console.log(`[browser/action] Executing action '${action}' on session ${sessionId}:`, params);
    
    const browserAction: BrowserAction = {
      type: action,
      params: params || {},
    };
    
    const result = await browserSessionManager.executeAction(sessionId, browserAction);
    
    console.log(`[browser/action] Action '${action}' completed in ${result.duration}ms, success: ${result.success}`);
    
    return NextResponse.json({
      success: true,
      result,
    });
  } catch (error) {
    console.error('[browser/action] Error executing action:', error);
    
    const errorMessage = (error as Error).message;
    const isNotFound = errorMessage.includes('not found');
    
    return NextResponse.json(
      { 
        success: false, 
        error: errorMessage 
      },
      { status: isNotFound ? 404 : 500 }
    );
  }
}