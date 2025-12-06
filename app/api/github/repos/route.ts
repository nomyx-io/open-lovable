/**
 * GitHub Repositories API
 * 
 * GET /api/github/repos - List user's repositories
 * Query params:
 *   - nodeOnly: If true, only return repos with package.json
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createGitHubClient } from '@/lib/github';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Get user session
    const session = await getServerSession(authOptions);
    
    if (!session?.accessToken) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Parse query params
    const { searchParams } = new URL(request.url);
    const nodeOnly = searchParams.get('nodeOnly') === 'true';

    // Create GitHub client
    const github = createGitHubClient(session.accessToken);

    // Get repositories
    let repos;
    if (nodeOnly) {
      // Get only repos with package.json
      repos = await github.listNodeProjects();
    } else {
      // Get all repos
      repos = await github.listRepositories();
    }

    return NextResponse.json({
      success: true,
      repos,
      count: repos.length,
    });
  } catch (error) {
    console.error('[github/repos] Error:', error);
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}