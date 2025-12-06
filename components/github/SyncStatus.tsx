'use client';

/**
 * GitHub Sync Status Component
 * 
 * Displays the current sync state with GitHub.
 */

import { motion, AnimatePresence } from 'framer-motion';
import { 
  Cloud, 
  CloudOff, 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle2,
  XCircle,
  Upload
} from 'lucide-react';
import { useSyncState, usePendingChanges, useCurrentProject } from '@/lib/stores/github-store';

interface SyncStatusProps {
  className?: string;
  showLabel?: boolean;
  onSync?: () => void;
}

export function SyncStatus({ className = '', showLabel = true, onSync }: SyncStatusProps) {
  const syncState = useSyncState();
  const pendingChanges = usePendingChanges();
  const project = useCurrentProject();

  if (!project) {
    return null;
  }

  const statusConfig = {
    synced: {
      icon: CheckCircle2,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
      label: 'Synced',
      description: 'All changes saved',
    },
    pending: {
      icon: Upload,
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10',
      label: 'Pending',
      description: `${pendingChanges} unsaved change${pendingChanges !== 1 ? 's' : ''}`,
    },
    syncing: {
      icon: RefreshCw,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
      label: 'Syncing',
      description: 'Saving changes...',
    },
    conflict: {
      icon: AlertTriangle,
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-500/10',
      label: 'Conflict',
      description: 'Resolve conflicts',
    },
    error: {
      icon: XCircle,
      color: 'text-red-500',
      bgColor: 'bg-red-500/10',
      label: 'Error',
      description: 'Sync failed',
    },
    disconnected: {
      icon: CloudOff,
      color: 'text-gray-500',
      bgColor: 'bg-gray-500/10',
      label: 'Offline',
      description: 'No connection',
    },
  };

  const config = statusConfig[syncState];
  const Icon = config.icon;
  const isAnimating = syncState === 'syncing';
  const isClickable = syncState === 'pending' || syncState === 'error';

  return (
    <motion.button
      onClick={isClickable ? onSync : undefined}
      disabled={!isClickable}
      className={`
        flex items-center gap-2 px-3 py-1.5 rounded-lg
        ${config.bgColor}
        ${isClickable ? 'hover:opacity-80 cursor-pointer' : 'cursor-default'}
        transition-all duration-200
        ${className}
      `}
      whileHover={isClickable ? { scale: 1.02 } : undefined}
      whileTap={isClickable ? { scale: 0.98 } : undefined}
    >
      <motion.div
        animate={isAnimating ? { rotate: 360 } : undefined}
        transition={isAnimating ? { duration: 1, repeat: Infinity, ease: 'linear' } : undefined}
      >
        <Icon className={`w-4 h-4 ${config.color}`} />
      </motion.div>
      
      {showLabel && (
        <div className="flex flex-col items-start">
          <span className={`text-xs font-medium ${config.color}`}>
            {config.label}
          </span>
          <span className="text-[10px] text-gray-500 dark:text-gray-400">
            {config.description}
          </span>
        </div>
      )}
    </motion.button>
  );
}

/**
 * Compact sync indicator for toolbar
 */
export function SyncIndicator({ className = '' }: { className?: string }) {
  const syncState = useSyncState();
  const project = useCurrentProject();

  if (!project) {
    return null;
  }

  const colorMap = {
    synced: 'bg-green-500',
    pending: 'bg-orange-500',
    syncing: 'bg-blue-500',
    conflict: 'bg-yellow-500',
    error: 'bg-red-500',
    disconnected: 'bg-gray-500',
  };

  return (
    <div className={`relative ${className}`}>
      <Cloud className="w-5 h-5 text-gray-400" />
      <motion.div
        className={`absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full ${colorMap[syncState]}`}
        animate={syncState === 'syncing' ? { scale: [1, 1.2, 1] } : undefined}
        transition={syncState === 'syncing' ? { duration: 0.5, repeat: Infinity } : undefined}
      />
    </div>
  );
}

/**
 * Full sync panel with actions
 */
export function SyncPanel({ 
  onSync, 
  onPull, 
  className = '' 
}: { 
  onSync?: () => void;
  onPull?: () => void;
  className?: string;
}) {
  const syncState = useSyncState();
  const pendingChanges = usePendingChanges();
  const project = useCurrentProject();

  if (!project) {
    return (
      <div className={`p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg ${className}`}>
        <div className="flex items-center gap-3 text-gray-500">
          <CloudOff className="w-5 h-5" />
          <div>
            <p className="text-sm font-medium">No project open</p>
            <p className="text-xs">Open a GitHub repository to enable sync</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg ${className}`}>
      {/* Project info */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Cloud className="w-5 h-5 text-gray-500" />
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {project.repository.name}
            </p>
            <p className="text-xs text-gray-500">
              {project.metadata.branch}
            </p>
          </div>
        </div>
        <SyncStatus showLabel={false} onSync={onSync} />
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <motion.button
          onClick={onSync}
          disabled={syncState === 'syncing' || pendingChanges === 0}
          className={`
            flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg
            text-sm font-medium transition-colors
            ${pendingChanges > 0
              ? 'bg-orange-500 text-white hover:bg-orange-600'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-500 cursor-not-allowed'}
          `}
          whileHover={pendingChanges > 0 ? { scale: 1.02 } : undefined}
          whileTap={pendingChanges > 0 ? { scale: 0.98 } : undefined}
        >
          <Upload className="w-4 h-4" />
          Push {pendingChanges > 0 && `(${pendingChanges})`}
        </motion.button>
        
        <motion.button
          onClick={onPull}
          disabled={syncState === 'syncing'}
          className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 text-sm font-medium transition-colors"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <RefreshCw className="w-4 h-4" />
          Pull
        </motion.button>
      </div>

      {/* Status message */}
      {syncState === 'conflict' && (
        <div className="mt-3 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
          <div className="flex items-center gap-2 text-yellow-700 dark:text-yellow-400">
            <AlertTriangle className="w-4 h-4" />
            <p className="text-xs">
              There are conflicts that need to be resolved before syncing.
            </p>
          </div>
        </div>
      )}

      {syncState === 'error' && (
        <div className="mt-3 p-2 bg-red-50 dark:bg-red-900/20 rounded-lg">
          <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
            <XCircle className="w-4 h-4" />
            <p className="text-xs">
              Sync failed. Click Push to try again.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default SyncStatus;