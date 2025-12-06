'use client';

/**
 * GitHub User Menu
 * 
 * Shows user avatar with dropdown menu for account actions.
 */

import { useState, useRef, useEffect } from 'react';
import { signOut, useSession } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, 
  LogOut, 
  Settings, 
  FolderGit2, 
  ChevronDown,
  ExternalLink
} from 'lucide-react';

interface UserMenuProps {
  onOpenRepos?: () => void;
}

export function UserMenu({ onOpenRepos }: UserMenuProps) {
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!session?.user) {
    return null;
  }

  const user = session.user;

  return (
    <div className="relative" ref={menuRef}>
      {/* Trigger */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        whileTap={{ scale: 0.98 }}
      >
        {user.image ? (
          <img
            src={user.image}
            alt={user.name || 'User'}
            className="w-8 h-8 rounded-full border-2 border-gray-200 dark:border-gray-700"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
            <User className="w-4 h-4 text-gray-500" />
          </div>
        )}
        <span className="hidden sm:inline text-sm font-medium text-gray-700 dark:text-gray-300">
          {user.login || user.name || 'User'}
        </span>
        <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </motion.button>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden z-50"
          >
            {/* User info header */}
            <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                {user.image && (
                  <img
                    src={user.image}
                    alt={user.name || 'User'}
                    className="w-10 h-10 rounded-full"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {user.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    @{user.login}
                  </p>
                </div>
              </div>
            </div>

            {/* Menu items */}
            <div className="py-2">
              <button
                onClick={() => {
                  setIsOpen(false);
                  onOpenRepos?.();
                }}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <FolderGit2 className="w-4 h-4" />
                <span>My Repositories</span>
              </button>
              
              <a
                href={`https://github.com/${user.login}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                <span>View GitHub Profile</span>
              </a>

              <button
                onClick={() => {
                  setIsOpen(false);
                  // TODO: Open settings
                }}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <Settings className="w-4 h-4" />
                <span>Settings</span>
              </button>
            </div>

            {/* Sign out */}
            <div className="py-2 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => {
                  setIsOpen(false);
                  signOut();
                }}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default UserMenu;