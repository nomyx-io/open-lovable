/**
 * GitHub Repository Details API
 * 
 * GET /api/github/repos/[owner]/[repo] - Get repository details
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
    const github = createGitHubClient(session.accessToken);

    const repository = await github.getRepository(owner, repo);

    return NextResponse.json({
      success: true,
      repository,
    });
  } catch (error) {
    console.error('[github/repos/[owner]/[repo]] Error:', error);
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}