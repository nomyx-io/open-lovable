'use client';

/**
 * GitHub Repository Selector
 * 
 * Browse and select repositories to open as projects.
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FolderGit2, 
  Search, 
  Loader2, 
  Lock, 
  Globe,
  Star,
  GitBranch,
  Package,
  X,
  RefreshCw
} from 'lucide-react';
import type { GitHubRepository } from '@/lib/github';

interface RepoSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectRepo: (repo: GitHubRepository) => void;
}

type FilterType = 'all' | 'node';

export function RepoSelector({ isOpen, onClose, onSelectRepo }: RepoSelectorProps) {
  const [repos, setRepos] = useState<GitHubRepository[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterType>('node');

  // Fetch repositories
  const fetchRepos = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const url = filter === 'node' 
        ? '/api/github/repos?nodeOnly=true'
        : '/api/github/repos';
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch repositories');
      }
      
      setRepos(data.repos);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch on open or filter change
  useEffect(() => {
    if (isOpen) {
      fetchRepos();
    }
  }, [isOpen, filter]);

  // Filter repos by search
  const filteredRepos = repos.filter(repo => 
    repo.name.toLowerCase().includes(search.toLowerCase()) ||
    repo.description?.toLowerCase().includes(search.toLowerCase())
  );

  // Format date
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'Never';
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
    if (days < 365) return `${Math.floor(days / 30)} months ago`;
    return `${Math.floor(days / 365)} years ago`;
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <FolderGit2 className="w-5 h-5 text-orange-500" />
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Open Repository
                </h2>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Search and filter */}
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search repositories..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-800 border-0 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div className="flex rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => setFilter('node')}
                  className={`px-3 py-2 text-sm font-medium transition-colors ${
                    filter === 'node'
                      ? 'bg-orange-500 text-white'
                      : 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <Package className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setFilter('all')}
                  className={`px-3 py-2 text-sm font-medium transition-colors ${
                    filter === 'all'
                      ? 'bg-orange-500 text-white'
                      : 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  All
                </button>
              </div>
              <button
                onClick={fetchRepos}
                disabled={loading}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                title="Refresh"
              >
                <RefreshCw className={`w-4 h-4 text-gray-500 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="overflow-y-auto max-h-[60vh]">
            {loading && repos.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16">
                <Loader2 className="w-8 h-8 text-orange-500 animate-spin mb-4" />
                <p className="text-sm text-gray-500">Loading repositories...</p>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-16">
                <p className="text-sm text-red-500 mb-4">{error}</p>
                <button
                  onClick={fetchRepos}
                  className="px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg text-sm font-medium transition-colors"
                >
                  Try Again
                </button>
              </div>
            ) : filteredRepos.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16">
                <FolderGit2 className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-4" />
                <p className="text-sm text-gray-500">
                  {search ? 'No repositories match your search' : 
                   filter === 'node' ? 'No Node.js projects found' : 'No repositories found'}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {filteredRepos.map(repo => (
                  <motion.button
                    key={repo.id}
                    onClick={() => onSelectRepo(repo)}
                    className="w-full p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors text-left"
                    whileHover={{ x: 4 }}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-1">
                        {repo.private ? (
                          <Lock className="w-4 h-4 text-yellow-500" />
                        ) : (
                          <Globe className="w-4 h-4 text-gray-400" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-gray-900 dark:text-white">
                            {repo.name}
                          </span>
                          {repo.hasPackageJson && (
                            <span className="px-1.5 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-[10px] font-medium rounded">
                              Node.js
                            </span>
                          )}
                        </div>
                        {repo.description && (
                          <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-2">
                            {repo.description}
                          </p>
                        )}
                        <div className="flex items-center gap-4 text-xs text-gray-400">
                          {repo.language && (
                            <span className="flex items-center gap-1">
                              <span className="w-2 h-2 rounded-full bg-orange-500" />
                              {repo.language}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <GitBranch className="w-3 h-3" />
                            {repo.default_branch}
                          </span>
                          <span>Updated {formatDate(repo.pushed_at)}</span>
                        </div>
                      </div>
                    </div>
                  </motion.button>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
            <p className="text-xs text-gray-500 text-center">
              {filter === 'node' 
                ? 'Showing repositories with package.json'
                : `Showing ${filteredRepos.length} of ${repos.length} repositories`}
            </p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default RepoSelector;