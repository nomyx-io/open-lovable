import { NextRequest, NextResponse } from 'next/server';
import { sandboxManager } from '@/lib/sandbox/sandbox-manager';

export async function POST(request: NextRequest) {
  try {
    const { sandboxId } = await request.json();
    
    if (!sandboxId) {
      return NextResponse.json({
        success: false,
        error: 'Sandbox ID is required'
      }, { status: 400 });
    }
    
    // Check if we have this sandbox in the manager
    const provider = sandboxManager.getProvider(sandboxId);
    
    if (!provider) {
      // Try to get the active provider if this is the active sandbox
      const activeProvider = sandboxManager.getActiveProvider();
      
      if (!activeProvider) {
        return NextResponse.json({
          success: true,
          isAlive: false,
          reason: 'Sandbox not found in manager'
        });
      }
      
      // Check if the active provider matches
      const sandboxInfo = activeProvider.getSandboxInfo?.();
      if (sandboxInfo?.sandboxId === sandboxId) {
        const isAlive = activeProvider.isAlive?.() ?? false;
        return NextResponse.json({
          success: true,
          isAlive,
          sandboxInfo
        });
      }
      
      return NextResponse.json({
        success: true,
        isAlive: false,
        reason: 'Sandbox ID does not match active sandbox'
      });
    }
    
    // Check if the sandbox is still alive
    const isAlive = provider.isAlive?.() ?? false;
    const sandboxInfo = provider.getSandboxInfo?.();
    
    return NextResponse.json({
      success: true,
      isAlive,
      sandboxInfo
    });
    
  } catch (error) {
    console.error('[sandbox-status] Error:', error);
    return NextResponse.json({
      success: false,
      error: (error as Error).message
    }, { status: 500 });
  }
}