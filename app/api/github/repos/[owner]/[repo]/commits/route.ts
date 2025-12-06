/**
 * GitHub Repository Commits API
 * 
 * GET /api/github/repos/[owner]/[repo]/commits - List commits
 * POST /api/github/repos/[owner]/[repo]/commits - Create a commit with multiple files
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createGitHubClient } from '@/lib/github';
import type { FileChange } from '@/lib/github';

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
    const branch = searchParams.get('branch') || undefined;
    const path = searchParams.get('path') || undefined;
    const perPage = parseInt(searchParams.get('perPage') || '30');
    const page = parseInt(searchParams.get('page') || '1');

    const github = createGitHubClient(session.accessToken);

    const commits = await github.listCommits(owner, repo, {
      branch,
      path,
      perPage,
      page,
    });

    return NextResponse.json({
      success: true,
      commits,
      count: commits.length,
    });
  } catch (error) {
    console.error('[github/repos/commits] GET Error:', error);
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.accessToken) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const { owner, repo } = await params;
    const body = await request.json();
    const { message, files, branch } = body as {
      message: string;
      files: FileChange[];
      branch?: string;
    };

    if (!message) {
      return NextResponse.json(
        { success: false, error: 'Commit message is required' },
        { status: 400 }
      );
    }

    if (!files || files.length === 0) {
      return NextResponse.json(
        { success: false, error: 'At least one file change is required' },
        { status: 400 }
      );
    }

    const github = createGitHubClient(session.accessToken);

    const commit = await github.createCommit(owner, repo, files, message, branch);

    return NextResponse.json({
      success: true,
      commit,
    });
  } catch (error) {
    console.error('[github/repos/commits] POST Error:', error);
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}