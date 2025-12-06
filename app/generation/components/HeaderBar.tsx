'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { appConfig } from '@/config/app.config';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import type { SandboxData, ConversationContext } from '../types';

interface HeaderBarProps {
  aiModel: string;
  setAiModel: (model: string) => void;
  sandboxData: SandboxData | null;
  conversationContext: ConversationContext;
  onCreateSandbox: () => void;
  onReapplyLastGeneration: () => void;
  onDownloadZip: () => void;
}

// Tooltip component for better UX
function Tooltip({ children, content }: { children: React.ReactNode; content: string }) {
  const [isVisible, setIsVisible] = useState(false);
  
  return (
    <div
      className="relative inline-flex"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      <div
        className={`
          absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1.5
          bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-xs font-medium rounded-lg
          whitespace-nowrap pointer-events-none z-50
          transition-all duration-200 ease-out
          ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1'}
        `}
      >
        {content}
        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1">
          <div className="border-4 border-transparent border-t-gray-900 dark:border-t-gray-100" />
        </div>
      </div>
    </div>
  );
}

// Icon button component for consistent styling
function IconButton({
  onClick,
  disabled = false,
  tooltip,
  variant = 'default',
  children
}: {
  onClick: () => void;
  disabled?: boolean;
  tooltip: string;
  variant?: 'default' | 'primary' | 'success';
  children: React.ReactNode;
}) {
  const baseClasses = `
    p-2 rounded-lg transition-all duration-200 ease-out
    focus:outline-none focus:ring-2 focus:ring-offset-1 dark:focus:ring-offset-gray-900
    disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none
    active:scale-95
  `;
  
  const variantClasses = {
    default: 'bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600 focus:ring-gray-400',
    primary: 'bg-orange-50 dark:bg-orange-900/30 border border-orange-200 dark:border-orange-800 text-orange-600 dark:text-orange-400 hover:bg-orange-100 dark:hover:bg-orange-900/50 hover:text-orange-700 dark:hover:text-orange-300 hover:border-orange-300 dark:hover:border-orange-700 focus:ring-orange-400',
    success: 'bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/50 hover:text-green-700 dark:hover:text-green-300 hover:border-green-300 dark:hover:border-green-700 focus:ring-green-400',
  };
  
  return (
    <Tooltip content={tooltip}>
      <button
        onClick={onClick}
        disabled={disabled}
        className={`${baseClasses} ${variantClasses[variant]}`}
      >
        {children}
      </button>
    </Tooltip>
  );
}

export function HeaderBar({
  aiModel,
  setAiModel,
  sandboxData,
  conversationContext,
  onCreateSandbox,
  onReapplyLastGeneration,
  onDownloadZip
}: HeaderBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleModelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newModel = e.target.value;
    setAiModel(newModel);
    const params = new URLSearchParams(searchParams);
    params.set('model', newModel);
    if (sandboxData?.sandboxId) {
      params.set('sandbox', sandboxData.sandboxId);
    }
    router.push(`/generation?${params.toString()}`);
  };

  return (
    <header className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm px-4 py-3 border-b border-gray-200/80 dark:border-gray-700/80 flex items-center justify-between sticky top-0 z-40 shadow-sm transition-colors duration-300">
      {/* Left: Logo & Brand */}
      <div className="flex items-center gap-4">
        <Link
          href="/"
          className="flex items-center gap-2.5 group transition-all duration-200 hover:opacity-80"
        >
          <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center shadow-md shadow-orange-200/50 dark:shadow-orange-900/30 group-hover:shadow-lg group-hover:shadow-orange-300/50 dark:group-hover:shadow-orange-800/30 transition-shadow">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-white">
              <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 hidden sm:block">Open Lovable</span>
        </Link>
        
        {/* Separator */}
        <div className="hidden sm:block w-px h-6 bg-gray-200 dark:bg-gray-700" />
        
        {/* Page indicator */}
        <div className="hidden sm:flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span>Generation</span>
        </div>
      </div>
      
      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        {/* Theme Toggle */}
        <ThemeToggle size="sm" />
        
        {/* Divider */}
        <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1" />
        
        {/* Sandbox Status Indicator */}
        {sandboxData && (
          <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700 rounded-lg mr-2">
            <div className="relative">
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              <div className="absolute inset-0 w-2 h-2 bg-green-400 rounded-full animate-ping opacity-75" />
            </div>
            <span className="text-xs font-medium text-green-700 dark:text-green-400">Sandbox Active</span>
          </div>
        )}
        
        {/* Model Selector */}
        <div className="relative">
          <select
            value={aiModel}
            onChange={handleModelChange}
            className="
              appearance-none pl-3 pr-8 py-2 text-sm font-medium text-gray-700 dark:text-gray-200
              bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg
              focus:outline-none focus:ring-2 focus:ring-orange-400/50 focus:border-orange-400
              hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700
              transition-all duration-200 cursor-pointer
            "
          >
            {appConfig.ai.availableModels.map(model => (
              <option key={model} value={model}>
                {appConfig.ai.modelDisplayNames?.[model] || model}
              </option>
            ))}
          </select>
          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="text-gray-400 dark:text-gray-500">
              <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>
        
        {/* Divider */}
        <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1" />
        
        {/* Action Buttons */}
        <IconButton
          onClick={onCreateSandbox}
          tooltip="New Sandbox"
          variant="primary"
        >
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
        </IconButton>
        
        <IconButton
          onClick={onReapplyLastGeneration}
          tooltip="Re-apply Last Generation"
          disabled={!conversationContext.lastGeneratedCode || !sandboxData}
        >
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </IconButton>
        
        <IconButton
          onClick={onDownloadZip}
          disabled={!sandboxData}
          tooltip="Download as ZIP"
          variant="success"
        >
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
        </IconButton>
      </div>
    </header>
  );
}