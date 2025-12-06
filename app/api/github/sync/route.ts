/**
 * GitHub Sync API
 * 
 * POST /api/github/sync - Push pending changes to GitHub
 * GET /api/github/sync - Get sync status
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createGitHubClient } from '@/lib/github';
import type { FileChange } from '@/lib/github';

export const dynamic = 'force-dynamic';

/**
 * POST - Push changes to GitHub
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.accessToken) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { owner, repo, branch, changes, message } = body as {
      owner: string;
      repo: string;
      branch?: string;
      changes: FileChange[];
      message: string;
    };

    if (!owner || !repo || !changes || !message) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: owner, repo, changes, message' },
        { status: 400 }
      );
    }

    if (changes.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No changes to sync',
        commit: null,
      });
    }

    const github = createGitHubClient(session.accessToken);

    // Create commit with all changes
    const commit = await github.createCommit(
      owner,
      repo,
      changes,
      message,
      branch
    );

    return NextResponse.json({
      success: true,
      commit: {
        sha: commit.sha,
        message: commit.message,
        url: commit.html_url,
      },
      filesChanged: changes.length,
    });
  } catch (error) {
    console.error('[github/sync] Error:', error);
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}

/**
 * GET - Get sync status (compare local vs remote)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.accessToken) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const owner = searchParams.get('owner');
    const repo = searchParams.get('repo');
    const localSha = searchParams.get('localSha');

    if (!owner || !repo) {
      return NextResponse.json(
        { success: false, error: 'Missing required params: owner, repo' },
        { status: 400 }
      );
    }

    const github = createGitHubClient(session.accessToken);

    // Get latest commit
    const commits = await github.listCommits(owner, repo, { perPage: 1 });
    const latestRemote = commits[0];

    if (!latestRemote) {
      return NextResponse.json({
        success: true,
        status: 'empty',
        message: 'Repository has no commits',
      });
    }

    // Compare if local SHA provided
    if (localSha) {
      if (localSha === latestRemote.sha) {
        return NextResponse.json({
          success: true,
          status: 'synced',
          remoteSha: latestRemote.sha,
          message: 'Local is up to date with remote',
        });
      }

      // Check if local is behind or ahead
      try {
        const comparison = await github.compareCommits(owner, repo, localSha, latestRemote.sha);
        
        return NextResponse.json({
          success: true,
          status: comparison.ahead_by > 0 ? 'behind' : 'diverged',
          remoteSha: latestRemote.sha,
          localSha,
          aheadBy: comparison.ahead_by,
          behindBy: comparison.behind_by,
          message: comparison.ahead_by > 0 
            ? `Remote is ${comparison.ahead_by} commits ahead`
            : 'Commits have diverged',
        });
      } catch {
        // If comparison fails, commits might not share history
        return NextResponse.json({
          success: true,
          status: 'unknown',
          remoteSha: latestRemote.sha,
          localSha,
          message: 'Could not compare commits',
        });
      }
    }

    return NextResponse.json({
      success: true,
      status: 'unknown',
      remoteSha: latestRemote.sha,
      message: 'No local SHA provided for comparison',
    });
  } catch (error) {
    console.error('[github/sync] Error:', error);
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}