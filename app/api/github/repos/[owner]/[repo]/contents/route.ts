/**
 * GitHub Repository Contents API
 * 
 * GET /api/github/repos/[owner]/[repo]/contents - Get repository file tree
 * Query params:
 *   - path: Optional path within the repo
 *   - ref: Optional branch/commit ref
 *   - tree: If true, get full recursive tree
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createGitHubClient } from '@/lib/github';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{
    owner: string;
    repo: string;
  }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.accessToken) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const { owner, repo } = await params;
    const { searchParams } = new URL(request.url);
    const path = searchParams.get('path') || '';
    const ref = searchParams.get('ref') || undefined;
    const fullTree = searchParams.get('tree') === 'true';

    const github = createGitHubClient(session.accessToken);

    let contents;
    if (fullTree) {
      contents = await github.getFileTree(owner, repo, ref);
    } else {
      contents = await github.getContents(owner, repo, path, ref);
    }

    return NextResponse.json({
      success: true,
      contents,
      path,
      count: contents.length,
    });
  } catch (error) {
    console.error('[github/repos/contents] Error:', error);
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}