'use client';

/**
 * Checkpoint Panel Component
 * 
 * Displays checkpoints and allows creating new ones.
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bookmark, 
  Clock, 
  Plus, 
  RotateCcw, 
  ChevronDown,
  ChevronUp,
  Loader2,
  CheckCircle2,
  GitCommit,
  History
} from 'lucide-react';
import type { Checkpoint } from '@/lib/github';

interface CheckpointPanelProps {
  checkpoints: Checkpoint[];
  isLoading?: boolean;
  onCreateCheckpoint?: (name: string, type?: Checkpoint['type']) => Promise<void>;
  onRestoreCheckpoint?: (id: string) => Promise<void>;
  className?: string;
}

export function CheckpointPanel({
  checkpoints,
  isLoading = false,
  onCreateCheckpoint,
  onRestoreCheckpoint,
  className = '',
}: CheckpointPanelProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [newCheckpointName, setNewCheckpointName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isRestoring, setIsRestoring] = useState<string | null>(null);
  const [showInput, setShowInput] = useState(false);

  const handleCreate = async () => {
    if (!newCheckpointName.trim() || !onCreateCheckpoint) return;
    
    setIsCreating(true);
    try {
      await onCreateCheckpoint(newCheckpointName.trim());
      setNewCheckpointName('');
      setShowInput(false);
    } finally {
      setIsCreating(false);
    }
  };

  const handleRestore = async (id: string) => {
    if (!onRestoreCheckpoint) return;
    
    setIsRestoring(id);
    try {
      await onRestoreCheckpoint(id);
    } finally {
      setIsRestoring(null);
    }
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const typeIcons = {
    manual: Bookmark,
    auto: Clock,
    milestone: CheckCircle2,
  };

  const typeColors = {
    manual: 'text-blue-500 bg-blue-500/10',
    auto: 'text-gray-500 bg-gray-500/10',
    milestone: 'text-green-500 bg-green-500/10',
  };

  return (
    <div className={`bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 ${className}`}>
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors rounded-t-xl"
      >
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-orange-500" />
          <span className="text-sm font-medium text-gray-900 dark:text-white">
            Checkpoints
          </span>
          <span className="text-xs text-gray-500">
            ({checkpoints.length})
          </span>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-gray-400" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-400" />
        )}
      </button>

      {/* Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 border-t border-gray-100 dark:border-gray-800">
              {/* Create new checkpoint */}
              <div className="mt-3">
                {showInput ? (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newCheckpointName}
                      onChange={(e) => setNewCheckpointName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                      placeholder="Checkpoint name..."
                      className="flex-1 px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                      autoFocus
                    />
                    <motion.button
                      onClick={handleCreate}
                      disabled={!newCheckpointName.trim() || isCreating}
                      className="px-3 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {isCreating ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        'Save'
                      )}
                    </motion.button>
                  </div>
                ) : (
                  <motion.button
                    onClick={() => setShowInput(true)}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-sm text-gray-600 dark:text-gray-400 transition-colors"
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                  >
                    <Plus className="w-4 h-4" />
                    Create Checkpoint
                  </motion.button>
                )}
              </div>

              {/* Checkpoints list */}
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
                </div>
              ) : checkpoints.length === 0 ? (
                <div className="py-8 text-center">
                  <GitCommit className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">No checkpoints yet</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Create a checkpoint to save your progress
                  </p>
                </div>
              ) : (
                <div className="mt-4 space-y-2 max-h-64 overflow-y-auto">
                  {checkpoints.map((checkpoint) => {
                    const TypeIcon = typeIcons[checkpoint.type];
                    const isCurrentlyRestoring = isRestoring === checkpoint.id;

                    return (
                      <motion.div
                        key={checkpoint.id}
                        className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 group"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <div className={`p-1 rounded ${typeColors[checkpoint.type]}`}>
                            <TypeIcon className="w-3 h-3" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                              {checkpoint.message}
                            </p>
                            <p className="text-xs text-gray-500">
                              {formatTime(checkpoint.timestamp)}
                            </p>
                          </div>
                        </div>
                        
                        <motion.button
                          onClick={() => handleRestore(checkpoint.id)}
                          disabled={isCurrentlyRestoring}
                          className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-all"
                          title="Restore to this checkpoint"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          {isCurrentlyRestoring ? (
                            <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
                          ) : (
                            <RotateCcw className="w-4 h-4 text-gray-400" />
                          )}
                        </motion.button>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default CheckpointPanel;