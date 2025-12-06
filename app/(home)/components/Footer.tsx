"use client";

import { LogoIcon, GitHubIcon } from "./icons";

export function Footer() {
  return (
    <footer className="relative z-10 py-12 border-t border-gray-200/50 dark:border-gray-800/50 bg-white/30 dark:bg-gray-900/30 backdrop-blur-sm">
      <div className="container px-4 lg:px-16">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
              <LogoIcon className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Open source AI website builder
            </span>
          </div>
          <div className="flex items-center gap-6 text-sm text-gray-500 dark:text-gray-400">
            <span>Built with Next.js, React & AI</span>
            <a
              href="https://github.com/mendableai/open-lovable"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-orange-500 transition-colors flex items-center gap-1"
            >
              <GitHubIcon className="w-4 h-4" />
              GitHub
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}