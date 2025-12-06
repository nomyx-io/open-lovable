'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from './theme-provider';

interface ThemeToggleProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export function ThemeToggle({ className = '', size = 'md', showLabel = false }: ThemeToggleProps) {
  const { theme, resolvedTheme, setTheme, toggleTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  const sizes = {
    sm: { button: 'w-12 h-6', icon: 14, knob: 'w-4 h-4', translate: 'translate-x-6' },
    md: { button: 'w-14 h-7', icon: 16, knob: 'w-5 h-5', translate: 'translate-x-7' },
    lg: { button: 'w-16 h-8', icon: 18, knob: 'w-6 h-6', translate: 'translate-x-8' }
  };

  const s = sizes[size];

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {showLabel && (
        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
          {isDark ? 'Dark' : 'Light'}
        </span>
      )}
      
      <motion.button
        onClick={toggleTheme}
        className={`
          relative ${s.button} rounded-full p-1
          transition-colors duration-300
          ${isDark 
            ? 'bg-gray-800 border border-gray-700' 
            : 'bg-gray-200 border border-gray-300'
          }
          focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 
          focus-visible:ring-orange-500 dark:focus-visible:ring-offset-gray-900
        `}
        whileTap={{ scale: 0.95 }}
        aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      >
        {/* Background gradient for sun/moon ambiance */}
        <motion.div
          className="absolute inset-0 rounded-full opacity-50"
          animate={{
            background: isDark 
              ? 'radial-gradient(circle at 80% 50%, #1e3a5f 0%, transparent 60%)'
              : 'radial-gradient(circle at 20% 50%, #fef3c7 0%, transparent 60%)'
          }}
          transition={{ duration: 0.3 }}
        />

        {/* Knob with icon */}
        <motion.div
          className={`
            relative ${s.knob} rounded-full shadow-md
            flex items-center justify-center
            ${isDark 
              ? 'bg-gray-700' 
              : 'bg-white'
            }
          `}
          animate={{
            x: isDark ? parseInt(s.translate.split('x-')[1]) * 4 : 0
          }}
          transition={{
            type: 'spring',
            stiffness: 500,
            damping: 30
          }}
        >
          <AnimatePresence mode="wait">
            {isDark ? (
              <motion.svg
                key="moon"
                initial={{ opacity: 0, rotate: -90, scale: 0.5 }}
                animate={{ opacity: 1, rotate: 0, scale: 1 }}
                exit={{ opacity: 0, rotate: 90, scale: 0.5 }}
                transition={{ duration: 0.2 }}
                width={s.icon - 4}
                height={s.icon - 4}
                viewBox="0 0 24 24"
                fill="none"
                className="text-yellow-400"
              >
                <path
                  d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"
                  fill="currentColor"
                />
              </motion.svg>
            ) : (
              <motion.svg
                key="sun"
                initial={{ opacity: 0, rotate: 90, scale: 0.5 }}
                animate={{ opacity: 1, rotate: 0, scale: 1 }}
                exit={{ opacity: 0, rotate: -90, scale: 0.5 }}
                transition={{ duration: 0.2 }}
                width={s.icon - 4}
                height={s.icon - 4}
                viewBox="0 0 24 24"
                fill="none"
                className="text-orange-500"
              >
                <circle cx="12" cy="12" r="5" fill="currentColor" />
                <path
                  d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </motion.svg>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Stars decoration for dark mode */}
        <AnimatePresence>
          {isDark && (
            <>
              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0 }}
                transition={{ delay: 0.1 }}
                className="absolute left-2 top-1.5 w-0.5 h-0.5 bg-white rounded-full"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0 }}
                transition={{ delay: 0.15 }}
                className="absolute left-3 bottom-2 w-1 h-1 bg-white/80 rounded-full"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0 }}
                transition={{ delay: 0.2 }}
                className="absolute left-1.5 top-3 w-0.5 h-0.5 bg-white/60 rounded-full"
              />
            </>
          )}
        </AnimatePresence>
      </motion.button>
    </div>
  );
}

// Alternative: Simple icon button toggle
export function ThemeToggleIcon({ className = '' }: { className?: string }) {
  const { resolvedTheme, toggleTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  return (
    <motion.button
      onClick={toggleTheme}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={`
        p-2 rounded-lg transition-colors
        ${isDark 
          ? 'bg-gray-800 text-yellow-400 hover:bg-gray-700' 
          : 'bg-gray-100 text-orange-500 hover:bg-gray-200'
        }
        focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500
        ${className}
      `}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
    >
      <AnimatePresence mode="wait">
        {isDark ? (
          <motion.svg
            key="moon"
            initial={{ opacity: 0, rotate: -90 }}
            animate={{ opacity: 1, rotate: 0 }}
            exit={{ opacity: 0, rotate: 90 }}
            transition={{ duration: 0.2 }}
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
          </motion.svg>
        ) : (
          <motion.svg
            key="sun"
            initial={{ opacity: 0, rotate: 90 }}
            animate={{ opacity: 1, rotate: 0 }}
            exit={{ opacity: 0, rotate: -90 }}
            transition={{ duration: 0.2 }}
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <circle cx="12" cy="12" r="5" fill="currentColor" />
            <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
          </motion.svg>
        )}
      </AnimatePresence>
    </motion.button>
  );
}

// Dropdown menu for theme selection (light/dark/system)
export function ThemeDropdown({ className = '' }: { className?: string }) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  const options: { value: 'light' | 'dark' | 'system'; label: string; icon: React.ReactNode }[] = [
    {
      value: 'light',
      label: 'Light',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="12" cy="12" r="5" />
          <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" />
        </svg>
      )
    },
    {
      value: 'dark',
      label: 'Dark',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
        </svg>
      )
    },
    {
      value: 'system',
      label: 'System',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
          <line x1="8" y1="21" x2="16" y2="21" />
          <line x1="12" y1="17" x2="12" y2="21" />
        </svg>
      )
    }
  ];

  return (
    <div className={`relative inline-flex ${className}`}>
      <select
        value={theme}
        onChange={(e) => setTheme(e.target.value as 'light' | 'dark' | 'system')}
        className={`
          appearance-none pl-3 pr-8 py-2 text-sm font-medium rounded-lg
          border cursor-pointer transition-colors
          focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500
          ${isDark 
            ? 'bg-gray-800 border-gray-700 text-gray-200 hover:bg-gray-700' 
            : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
          }
        `}
      >
        {options.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none">
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className={isDark ? 'text-gray-400' : 'text-gray-500'}>
          <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </div>
  );
}