/**
 * GitHub Checkpoint API
 * 
 * POST /api/github/checkpoint - Create a new checkpoint
 * GET /api/github/checkpoint - List checkpoints
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createGitHubClient } from '@/lib/github';
import type { FileChange, Checkpoint } from '@/lib/github';

export const dynamic = 'force-dynamic';

/**
 * Checkpoint prefixes for commit messages
 */
const CHECKPOINT_PREFIXES = {
  manual: '📌',
  auto: '🔄',
  milestone: '🏆',
};

/**
 * POST - Create a new checkpoint
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
    const { owner, repo, branch, name, type, changes } = body as {
      owner: string;
      repo: string;
      branch?: string;
      name: string;
      type?: Checkpoint['type'];
      changes: FileChange[];
    };

    if (!owner || !repo || !name || !changes) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: owner, repo, name, changes' },
        { status: 400 }
      );
    }

    if (changes.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No changes to checkpoint' },
        { status: 400 }
      );
    }

    const checkpointType = type || 'manual';
    const prefix = CHECKPOINT_PREFIXES[checkpointType];
    const message = `${prefix} ${name}`;

    const github = createGitHubClient(session.accessToken);

    // Create commit
    const commit = await github.createCommit(
      owner,
      repo,
      changes,
      message,
      branch
    );

    // Build checkpoint response
    const checkpoint: Checkpoint = {
      id: commit.sha,
      message: name,
      type: checkpointType,
      timestamp: new Date(),
      commit: {
        sha: commit.sha,
        url: commit.html_url,
      },
      files: changes.length,
      additions: changes.filter(c => c.operation === 'create').length,
      deletions: changes.filter(c => c.operation === 'delete').length,
    };

    return NextResponse.json({
      success: true,
      checkpoint,
    });
  } catch (error) {
    console.error('[github/checkpoint] Error:', error);
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}

/**
 * GET - List checkpoints (commits with checkpoint prefixes)
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
    const branch = searchParams.get('branch') || undefined;
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    if (!owner || !repo) {
      return NextResponse.json(
        { success: false, error: 'Missing required params: owner, repo' },
        { status: 400 }
      );
    }

    const github = createGitHubClient(session.accessToken);

    // Get recent commits
    const commits = await github.listCommits(owner, repo, {
      branch,
      perPage: 100, // Get more to filter
    });

    // Filter to checkpoint commits only
    const checkpointPrefixes = Object.values(CHECKPOINT_PREFIXES);
    const checkpointCommits = commits.filter(commit =>
      checkpointPrefixes.some(prefix => commit.message.startsWith(prefix))
    );

    // Parse checkpoints
    const checkpoints: Checkpoint[] = checkpointCommits
      .slice(0, limit)
      .map(commit => {
        let type: Checkpoint['type'] = 'manual';
        let name = commit.message;

        if (commit.message.startsWith(CHECKPOINT_PREFIXES.auto)) {
          type = 'auto';
          name = commit.message.replace(CHECKPOINT_PREFIXES.auto, '').trim();
        } else if (commit.message.startsWith(CHECKPOINT_PREFIXES.milestone)) {
          type = 'milestone';
          name = commit.message.replace(CHECKPOINT_PREFIXES.milestone, '').trim();
        } else if (commit.message.startsWith(CHECKPOINT_PREFIXES.manual)) {
          type = 'manual';
          name = commit.message.replace(CHECKPOINT_PREFIXES.manual, '').trim();
        }

        return {
          id: commit.sha,
          message: name,
          type,
          timestamp: new Date(commit.author.date),
          commit: {
            sha: commit.sha,
            url: commit.html_url,
          },
          files: 0, // Would need additional API call
          additions: 0,
          deletions: 0,
        };
      });

    return NextResponse.json({
      success: true,
      checkpoints,
      total: checkpoints.length,
    });
  } catch (error) {
    console.error('[github/checkpoint] Error:', error);
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}