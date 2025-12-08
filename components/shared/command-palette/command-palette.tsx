"use client";

import { useEffect, useState, useCallback, ReactNode } from "react";
import { Command } from "cmdk";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";

interface CommandItem {
  id: string;
  label: string;
  icon?: ReactNode;
  shortcut?: string[];
  onSelect: () => void;
  keywords?: string[];
  group?: string;
}

interface CommandPaletteProps {
  items?: CommandItem[];
  placeholder?: string;
  emptyMessage?: string;
}

// Default navigation items
const defaultItems: CommandItem[] = [
  {
    id: "home",
    label: "Go to Home",
    shortcut: ["G", "H"],
    group: "Navigation",
    keywords: ["home", "landing", "main"],
    onSelect: () => {},
  },
  {
    id: "generation",
    label: "Go to Generation",
    shortcut: ["G", "G"],
    group: "Navigation",
    keywords: ["generate", "create", "build"],
    onSelect: () => {},
  },
  {
    id: "builder",
    label: "Go to Builder",
    shortcut: ["G", "B"],
    group: "Navigation",
    keywords: ["builder", "website", "clone"],
    onSelect: () => {},
  },
  {
    id: "theme-light",
    label: "Switch to Light Mode",
    group: "Theme",
    keywords: ["light", "theme", "mode"],
    onSelect: () => {},
  },
  {
    id: "theme-dark",
    label: "Switch to Dark Mode",
    group: "Theme",
    keywords: ["dark", "theme", "mode"],
    onSelect: () => {},
  },
  {
    id: "new-project",
    label: "Create New Project",
    shortcut: ["⌘", "N"],
    group: "Actions",
    keywords: ["new", "project", "create"],
    onSelect: () => {},
  },
  {
    id: "capture-screenshot",
    label: "Capture Screenshot",
    shortcut: ["⌘", "⇧", "S"],
    group: "Actions",
    keywords: ["screenshot", "capture", "image", "photo", "snap", "preview"],
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <path d="M21 15l-5-5L5 21" />
      </svg>
    ),
    onSelect: () => {},
  },
];

export function CommandPalette({
  items = defaultItems,
  placeholder = "Type a command or search...",
  emptyMessage = "No results found.",
}: CommandPaletteProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const router = useRouter();

  // Toggle command palette with Cmd+K or Ctrl+K
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
      
      if (e.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  // Enhanced items with router navigation
  const enhancedItems = items.map((item) => ({
    ...item,
    onSelect: () => {
      if (item.id === "home") router.push("/");
      else if (item.id === "generation") router.push("/generation");
      else if (item.id === "builder") router.push("/builder");
      else if (item.id === "theme-light") document.documentElement.classList.remove("dark");
      else if (item.id === "theme-dark") document.documentElement.classList.add("dark");
      else if (item.id === "capture-screenshot") {
        // Dispatch custom event to trigger screenshot capture
        const event = new CustomEvent('captureScreenshot', { bubbles: true });
        window.dispatchEvent(event);
      }
      else item.onSelect();
      setOpen(false);
    },
  }));

  // Group items
  const groupedItems = enhancedItems.reduce((acc, item) => {
    const group = item.group || "General";
    if (!acc[group]) acc[group] = [];
    acc[group].push(item);
    return acc;
  }, {} as Record<string, CommandItem[]>);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={() => setOpen(false)}
          />

          {/* Command Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ duration: 0.15, ease: [0.4, 0, 0.2, 1] }}
            className="fixed left-1/2 top-1/4 -translate-x-1/2 z-50 w-full max-w-xl"
          >
            <Command
              className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden"
              loop
            >
              {/* Search Input */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 dark:border-gray-800">
                <svg
                  className="w-5 h-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <Command.Input
                  value={search}
                  onValueChange={setSearch}
                  placeholder={placeholder}
                  className="flex-1 bg-transparent outline-none text-gray-900 dark:text-white placeholder:text-gray-400 text-sm"
                />
                <kbd className="hidden sm:flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded-lg text-xs text-gray-500 dark:text-gray-400 font-mono">
                  ESC
                </kbd>
              </div>

              {/* Results */}
              <Command.List className="max-h-80 overflow-y-auto p-2">
                <Command.Empty className="py-6 text-center text-sm text-gray-500 dark:text-gray-400">
                  {emptyMessage}
                </Command.Empty>

                {Object.entries(groupedItems).map(([group, groupItems]) => (
                  <Command.Group
                    key={group}
                    heading={group}
                    className="text-xs font-semibold text-gray-500 dark:text-gray-400 px-2 py-1.5"
                  >
                    {groupItems.map((item) => (
                      <Command.Item
                        key={item.id}
                        value={`${item.label} ${item.keywords?.join(" ") || ""}`}
                        onSelect={item.onSelect}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 aria-selected:bg-orange-50 dark:aria-selected:bg-orange-900/20 aria-selected:text-orange-600 dark:aria-selected:text-orange-400 transition-colors"
                      >
                        {item.icon && (
                          <span className="flex-shrink-0 w-5 h-5 flex items-center justify-center">
                            {item.icon}
                          </span>
                        )}
                        <span className="flex-1 text-sm font-medium">{item.label}</span>
                        {item.shortcut && (
                          <div className="flex items-center gap-1">
                            {item.shortcut.map((key, i) => (
                              <kbd
                                key={i}
                                className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-xs font-mono text-gray-500 dark:text-gray-400"
                              >
                                {key}
                              </kbd>
                            ))}
                          </div>
                        )}
                      </Command.Item>
                    ))}
                  </Command.Group>
                ))}
              </Command.List>

              {/* Footer */}
              <div className="flex items-center justify-between px-4 py-2 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                  <span>Navigate with</span>
                  <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded font-mono">↑</kbd>
                  <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded font-mono">↓</kbd>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                  <span>Select with</span>
                  <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded font-mono">↵</kbd>
                </div>
              </div>
            </Command>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// Hook to trigger command palette from anywhere
export function useCommandPalette() {
  const trigger = useCallback(() => {
    const event = new KeyboardEvent("keydown", {
      key: "k",
      metaKey: true,
    });
    document.dispatchEvent(event);
  }, []);

  return { trigger };
}