'use client';

import { motion, AnimatePresence } from 'framer-motion';

/**
 * ParallelProgress - Visual display of parallel code generation progress
 * 
 * Shows:
 * - Grid of component status (pending, generating, complete, error)
 * - Overall progress bar
 * - Estimated time remaining
 */

interface TaskStatus {
  name: string;
  status: 'pending' | 'generating' | 'complete' | 'error';
  error?: string;
}

interface ParallelProgressProps {
  tasks: TaskStatus[];
  progress: {
    completed: number;
    total: number;
    estimatedTimeRemainingMs?: number;
  };
  className?: string;
}

const statusIcons = {
  pending: (
    <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <circle cx="12" cy="12" r="10" strokeWidth={2} />
    </svg>
  ),
  generating: (
    <motion.div
      className="w-4 h-4 rounded-full border-2 border-orange-500 border-t-transparent"
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
    />
  ),
  complete: (
    <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  ),
  error: (
    <svg className="w-4 h-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
};

const statusColors = {
  pending: 'bg-gray-100 text-gray-600 border-gray-200',
  generating: 'bg-orange-50 text-orange-700 border-orange-200',
  complete: 'bg-green-50 text-green-700 border-green-200',
  error: 'bg-red-50 text-red-700 border-red-200',
};

function formatTime(ms: number): string {
  if (ms < 1000) return 'less than a second';
  if (ms < 60000) return `${Math.ceil(ms / 1000)}s`;
  return `${Math.ceil(ms / 60000)}m ${Math.ceil((ms % 60000) / 1000)}s`;
}

export function ParallelProgress({ tasks, progress, className = '' }: ParallelProgressProps) {
  const percentage = progress.total > 0 
    ? Math.round((progress.completed / progress.total) * 100) 
    : 0;

  return (
    <div className={`rounded-lg bg-white border border-gray-200 p-4 ${className}`}>
      {/* Header with overall progress */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
          <span className="text-sm font-medium text-gray-900">
            Generating Components
          </span>
        </div>
        <div className="text-sm text-gray-500">
          {progress.completed}/{progress.total} complete
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-4">
        <motion.div
          className="h-full bg-gradient-to-r from-orange-400 to-orange-600 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        />
      </div>

      {/* Estimated time remaining */}
      {progress.estimatedTimeRemainingMs && progress.completed < progress.total && (
        <div className="text-xs text-gray-500 mb-4">
          Estimated time remaining: {formatTime(progress.estimatedTimeRemainingMs)}
        </div>
      )}

      {/* Component grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
        <AnimatePresence mode="popLayout">
          {tasks.map((task, index) => (
            <motion.div
              key={task.name}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ delay: index * 0.05 }}
              className={`flex items-center gap-2 px-3 py-2 rounded-md border text-sm ${statusColors[task.status]}`}
              title={task.error}
            >
              {statusIcons[task.status]}
              <span className="truncate">{task.name}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Error summary if any */}
      {tasks.some(t => t.status === 'error') && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <div className="text-sm font-medium text-red-700 mb-1">
            Some components failed to generate:
          </div>
          <ul className="text-xs text-red-600 list-disc list-inside">
            {tasks
              .filter(t => t.status === 'error')
              .map(t => (
                <li key={t.name}>
                  {t.name}: {t.error || 'Unknown error'}
                </li>
              ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/**
 * Compact version for sidebar display
 */
export function ParallelProgressCompact({ tasks, progress }: ParallelProgressProps) {
  const percentage = progress.total > 0 
    ? Math.round((progress.completed / progress.total) * 100) 
    : 0;

  const generating = tasks.filter(t => t.status === 'generating');
  const completed = tasks.filter(t => t.status === 'complete');
  const errors = tasks.filter(t => t.status === 'error');

  return (
    <div className="flex items-center gap-3 text-sm">
      {/* Mini progress ring */}
      <div className="relative w-8 h-8">
        <svg className="w-8 h-8 transform -rotate-90">
          <circle
            cx="16"
            cy="16"
            r="14"
            stroke="currentColor"
            strokeWidth="2"
            fill="none"
            className="text-gray-200"
          />
          <motion.circle
            cx="16"
            cy="16"
            r="14"
            stroke="currentColor"
            strokeWidth="2"
            fill="none"
            strokeDasharray={87.96}
            initial={{ strokeDashoffset: 87.96 }}
            animate={{ strokeDashoffset: 87.96 * (1 - percentage / 100) }}
            className="text-orange-500"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center text-xs font-medium">
          {percentage}%
        </div>
      </div>

      {/* Status summary */}
      <div className="flex-1">
        <div className="flex items-center gap-1 text-gray-600">
          {generating.length > 0 && (
            <span className="text-orange-600">
              Generating {generating.map(t => t.name).join(', ')}...
            </span>
          )}
          {generating.length === 0 && completed.length === tasks.length && (
            <span className="text-green-600">All components generated!</span>
          )}
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-green-500" />
            {completed.length} done
          </span>
          {errors.length > 0 && (
            <span className="flex items-center gap-1 text-red-500">
              <span className="w-2 h-2 rounded-full bg-red-500" />
              {errors.length} failed
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default ParallelProgress;