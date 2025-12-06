/**
 * GitHub Checkpoint by ID API
 * 
 * GET /api/github/checkpoint/[id] - Get checkpoint details
 * POST /api/github/checkpoint/[id]/restore - Restore to checkpoint
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createGitHubClient } from '@/lib/github';

export const dynamic = 'force-dynamic';

/**
 * GET - Get checkpoint details and files
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.accessToken) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const owner = searchParams.get('owner');
    const repo = searchParams.get('repo');

    if (!owner || !repo) {
      return NextResponse.json(
        { success: false, error: 'Missing required params: owner, repo' },
        { status: 400 }
      );
    }

    const github = createGitHubClient(session.accessToken);

    // Get commit details
    const commit = await github.getCommit(owner, repo, id);

    // Get file tree at this commit
    const tree = await github.getFileTree(owner, repo, id);

    return NextResponse.json({
      success: true,
      checkpoint: {
        id: commit.sha,
        message: commit.message,
        author: commit.author,
        timestamp: commit.author.date,
        url: commit.html_url,
      },
      files: tree.filter(node => node.type === 'file').map(node => ({
        path: node.path,
        sha: node.sha,
        size: node.size,
      })),
    });
  } catch (error) {
    console.error('[github/checkpoint/[id]] Error:', error);
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}

/**
 * POST - Restore to this checkpoint
 * Creates a new commit that reverts to the checkpoint state
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.accessToken) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { owner, repo, branch } = body as {
      owner: string;
      repo: string;
      branch?: string;
    };

    if (!owner || !repo) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: owner, repo' },
        { status: 400 }
      );
    }

    const github = createGitHubClient(session.accessToken);

    // Get the original commit
    const originalCommit = await github.getCommit(owner, repo, id);

    // Get file tree at the checkpoint
    const tree = await github.getFileTree(owner, repo, id);

    // Binary file extensions to skip
    const binaryExtensions = [
      '.png', '.jpg', '.jpeg', '.gif', '.webp', '.ico', '.svg',
      '.woff', '.woff2', '.ttf', '.eot', '.otf',
      '.pdf', '.zip', '.tar', '.gz',
      '.mp3', '.mp4', '.wav',
    ];

    // Load all file contents
    const files: Array<{ path: string; content: string }> = [];
    
    for (const node of tree) {
      if (node.type !== 'file') continue;
      
      // Skip binary files
      const ext = node.path.substring(node.path.lastIndexOf('.')).toLowerCase();
      if (binaryExtensions.includes(ext)) continue;

      try {
        const content = await github.getFile(owner, repo, node.path, id);
        files.push({
          path: content.path,
          content: content.content,
        });
      } catch {
        // Skip files that can't be read
        console.warn(`Could not read file: ${node.path}`);
      }
    }

    // Create changes for restore
    const changes = files.map(file => ({
      path: file.path,
      content: file.content,
      operation: 'update' as const,
    }));

    // Create restore commit
    const restoreMessage = `🔙 Restored to: ${originalCommit.message.replace(/^[📌🔄🏆]\s*/, '')}`;
    
    const commit = await github.createCommit(
      owner,
      repo,
      changes,
      restoreMessage,
      branch
    );

    return NextResponse.json({
      success: true,
      commit: {
        sha: commit.sha,
        message: commit.message,
        url: commit.html_url,
      },
      filesRestored: files.length,
      restoredFrom: {
        sha: id,
        message: originalCommit.message,
      },
    });
  } catch (error) {
    console.error('[github/checkpoint/[id]] Error:', error);
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}