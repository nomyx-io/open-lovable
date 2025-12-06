'use client';

/**
 * Project Type Selector Component
 * 
 * Allows users to select the type of project they want to create
 * (Vite + React, Next.js App Router, etc.)
 */

import { getProjectTypeOptions } from '@/lib/projects/project-type-manager';
import type { ProjectTypeId } from '@/lib/projects/project-type';

interface ProjectTypeSelectorProps {
  value: ProjectTypeId;
  onChange: (projectType: ProjectTypeId) => void;
  disabled?: boolean;
  className?: string;
  variant?: 'dropdown' | 'cards' | 'tabs';
}

// Project type icons
const projectTypeIcons: Record<ProjectTypeId, React.ReactNode> = {
  'vite-react': (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12.001 4.8L2.4 12l9.6 7.2L21.6 12 12.001 4.8zm0 2.4l6.545 4.8-6.545 4.8-6.545-4.8 6.545-4.8z" />
    </svg>
  ),
  'nextjs-app': (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm-1.5 14.5v-9l7 4.5-7 4.5z" />
    </svg>
  ),
  'nextjs-pages': (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm-1.5 14.5v-9l7 4.5-7 4.5z" />
    </svg>
  ),
  'astro': (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
      <path d="M16.074 16.86c-.72.616-2.157 1.035-3.812 1.035-2.032 0-3.735-.632-4.187-1.483-.161.488-.198 1.046-.198 1.402 0 0-.106 1.75 1.111 2.968 0-.632.513-1.145 1.145-1.145 1.083 0 1.082.945 1.081 1.712v.069c0 1.164.711 2.161 1.723 2.582a2.347 2.347 0 0 1-.236-1.029c0-1.11.652-1.523 1.41-2.003.602-.383 1.272-.807 1.733-1.66a3.129 3.129 0 0 0 .378-1.494 3.14 3.14 0 0 0-.148-.954zM15.551 1.013l.003.006.186.31c.93 1.552 1.238 3.415.757 5.166l-.018.063-.002.006a8.998 8.998 0 0 1-1.742 3.053c.009.138.02.283.02.434 0 .748-.248 1.47-.688 2.064l-.011.015-.012.014c-.063.075-.13.148-.2.218l-3.196 3.28a.375.375 0 0 1-.54-.52l2.005-2.057a3.065 3.065 0 0 0 .84-2.63l-.004-.028-.005-.028c-.153-.813-.58-1.523-1.224-2.032l-.022-.018-.023-.016a6.002 6.002 0 0 0-3.357-1.044c-.334 0-.662.026-.983.077l-.017.003-.017.002c-1.728.267-3.257 1.156-4.352 2.491l-.008.01-.008.01c-.933 1.152-1.426 2.603-1.39 4.073.036 1.47.604 2.892 1.596 3.993l.163.18.172.171c.506.49 1.08.915 1.707 1.264l.009.005.009.005c.48.264 1.08.506 1.728.699l-5.9-9.09a.375.375 0 0 1 .108-.517l5.7-3.892a5.983 5.983 0 0 1 3.315-.968l.193.005c.957.035 1.888.29 2.727.74.183.098.36.205.53.32l.015.01.015.011 1.32.967a.375.375 0 0 1-.043.643l-1.823.99c.097.211.177.429.24.653l2.065-1.122a.375.375 0 0 1 .5.152z" />
    </svg>
  ),
  'expo': (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
    </svg>
  ),
};

// Badge colors for each project type
const projectTypeBadgeColors: Record<ProjectTypeId, string> = {
  'vite-react': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  'nextjs-app': 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
  'nextjs-pages': 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
  'astro': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  'expo': 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200',
};

export function ProjectTypeSelector({
  value,
  onChange,
  disabled = false,
  className = '',
  variant = 'dropdown'
}: ProjectTypeSelectorProps) {
  const options = getProjectTypeOptions();
  
  if (variant === 'cards') {
    return (
      <div className={`grid grid-cols-1 sm:grid-cols-2 gap-4 ${className}`}>
        {options.map((option) => (
          <button
            key={option.id}
            onClick={() => onChange(option.id)}
            disabled={disabled}
            className={`
              p-4 rounded-lg border-2 transition-all text-left
              ${value === option.id
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              }
              ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            `}
          >
            <div className="flex items-center gap-3 mb-2">
              <div className={`p-2 rounded-lg ${projectTypeBadgeColors[option.id]}`}>
                {projectTypeIcons[option.id]}
              </div>
              <span className="font-semibold text-gray-900 dark:text-white">
                {option.name}
              </span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {option.description}
            </p>
            {(option.id === 'nextjs-app' || option.id === 'astro') && (
              <div className="mt-2 flex gap-2">
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                  API Routes
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                  SSR
                </span>
                {option.id === 'astro' && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                    Islands
                  </span>
                )}
              </div>
            )}
            {option.id === 'expo' && (
              <div className="mt-2 flex gap-2">
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200">
                  iOS
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                  Android
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                  Web
                </span>
              </div>
            )}
          </button>
        ))}
      </div>
    );
  }
  
  if (variant === 'tabs') {
    return (
      <div className={`flex gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg ${className}`}>
        {options.map((option) => (
          <button
            key={option.id}
            onClick={() => onChange(option.id)}
            disabled={disabled}
            className={`
              flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all
              ${value === option.id
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }
              ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            `}
          >
            <div className="flex items-center justify-center gap-2">
              {projectTypeIcons[option.id]}
              <span>{option.name}</span>
            </div>
          </button>
        ))}
      </div>
    );
  }
  
  // Default: dropdown
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as ProjectTypeId)}
      disabled={disabled}
      className={`
        px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600
        bg-white dark:bg-gray-800 text-gray-900 dark:text-white
        focus:ring-2 focus:ring-blue-500 focus:border-blue-500
        disabled:opacity-50 disabled:cursor-not-allowed
        ${className}
      `}
    >
      {options.map((option) => (
        <option key={option.id} value={option.id}>
          {option.name}
        </option>
      ))}
    </select>
  );
}

/**
 * Compact badge showing current project type
 */
export function ProjectTypeBadge({
  projectType,
  className = ''
}: {
  projectType: ProjectTypeId;
  className?: string;
}) {
  const options = getProjectTypeOptions();
  const option = options.find(o => o.id === projectType);
  
  if (!option) return null;
  
  return (
    <span
      className={`
        inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium
        ${projectTypeBadgeColors[projectType]}
        ${className}
      `}
    >
      {projectTypeIcons[projectType]}
      {option.name}
    </span>
  );
}

export default ProjectTypeSelector;