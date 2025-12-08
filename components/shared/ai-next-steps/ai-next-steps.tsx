"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export interface NextStep {
  id: string;
  title: string;
  description: string;
  prompt: string;
  icon?: "enhance" | "add" | "fix" | "test" | "deploy" | "style" | "integrate" | "optimize";
  priority?: "high" | "medium" | "low";
  category?: "enhancement" | "feature" | "bugfix" | "testing" | "deployment" | "optimization";
}

interface AINextStepsProps {
  steps: NextStep[];
  onSelectStep: (step: NextStep) => void;
  isExpanded?: boolean;
  className?: string;
}

const iconMap = {
  enhance: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  add: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 5V19M5 12H19" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  fix: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  test: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  deploy: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 14.899A7 7 0 1115.71 8h1.79a4.5 4.5 0 012.5 8.242M12 12v9m0-9l-4 4m4-4l4 4" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  style: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  integrate: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  optimize: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
};

const priorityColors = {
  high: "from-red-500 to-orange-500",
  medium: "from-orange-500 to-yellow-500",
  low: "from-blue-500 to-cyan-500",
};

const categoryColors = {
  enhancement: "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300",
  feature: "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300",
  bugfix: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300",
  testing: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300",
  deployment: "bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300",
  optimization: "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300",
};

export function AINextSteps({
  steps,
  onSelectStep,
  isExpanded = true,
  className,
}: AINextStepsProps) {
  const [expanded, setExpanded] = useState(isExpanded);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  if (steps.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "bg-gradient-to-br from-gray-50 to-white dark:from-gray-800/50 dark:to-gray-900/50",
        "rounded-2xl border border-gray-200/80 dark:border-gray-700/80",
        "shadow-soft-md overflow-hidden",
        className
      )}
    >
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-4 py-3 flex items-center justify-between group hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center shadow-md shadow-orange-500/25">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-white">
              <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <rect x="9" y="3" width="6" height="4" rx="1" stroke="currentColor" strokeWidth="2"/>
              <path d="M9 12h6M9 16h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
          <div className="text-left">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              Suggested Next Steps
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Click any step to continue building
            </p>
          </div>
        </div>
        <motion.div
          animate={{ rotate: expanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </motion.div>
      </button>

      {/* Steps List */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
          >
            <div className="px-4 pb-4 space-y-2">
              {steps.map((step, index) => (
                <motion.button
                  key={step.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => onSelectStep(step)}
                  onMouseEnter={() => setHoveredId(step.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  className={cn(
                    "w-full text-left p-3 rounded-xl",
                    "bg-white dark:bg-gray-800/80",
                    "border border-gray-200/60 dark:border-gray-700/60",
                    "hover:border-orange-300 dark:hover:border-orange-600",
                    "hover:shadow-md hover:shadow-orange-500/5",
                    "transition-all duration-200 group/step"
                  )}
                >
                  <div className="flex items-start gap-3">
                    {/* Step Number/Icon */}
                    <div className={cn(
                      "flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center",
                      "bg-gray-100 dark:bg-gray-700",
                      "group-hover/step:bg-gradient-to-br",
                      step.priority ? `group-hover/step:${priorityColors[step.priority]}` : "group-hover/step:from-orange-500 group-hover/step:to-red-500",
                      "text-gray-600 dark:text-gray-400",
                      "group-hover/step:text-white",
                      "transition-all duration-200"
                    )}>
                      {step.icon ? iconMap[step.icon] : (
                        <span className="text-xs font-bold">{index + 1}</span>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-sm font-medium text-gray-900 dark:text-white group-hover/step:text-orange-600 dark:group-hover/step:text-orange-400 transition-colors">
                          {step.title}
                        </span>
                        {step.category && (
                          <span className={cn(
                            "text-[10px] px-1.5 py-0.5 rounded-md font-medium",
                            categoryColors[step.category]
                          )}>
                            {step.category}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                        {step.description}
                      </p>
                    </div>

                    {/* Arrow */}
                    <motion.div
                      animate={{ x: hoveredId === step.id ? 3 : 0 }}
                      className="flex-shrink-0 text-gray-300 dark:text-gray-600 group-hover/step:text-orange-500"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </motion.div>
                  </div>
                </motion.button>
              ))}
            </div>

            {/* Footer hint */}
            <div className="px-4 py-2 bg-gray-50 dark:bg-gray-800/30 border-t border-gray-100 dark:border-gray-700/50">
              <p className="text-[10px] text-gray-400 dark:text-gray-500 text-center">
                💡 These suggestions are based on your current project context
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// Helper function to generate context-aware next steps
export function generateNextSteps(context: {
  lastAction?: string;
  projectType?: string;
  hasErrors?: boolean;
  completedFeatures?: string[];
  currentFeature?: string;
}): NextStep[] {
  const steps: NextStep[] = [];

  // Base suggestions based on project state
  if (context.hasErrors) {
    steps.push({
      id: "fix-errors",
      title: "Fix Current Errors",
      description: "Let me help you resolve the build errors before continuing",
      prompt: "Please fix the current errors in my code",
      icon: "fix",
      priority: "high",
      category: "bugfix",
    });
  }

  if (context.lastAction?.includes("generated") || context.lastAction?.includes("created")) {
    // After code generation
    steps.push(
      {
        id: "add-animations",
        title: "Add Animations & Transitions",
        description: "Enhance the UI with smooth animations and micro-interactions",
        prompt: "Add smooth animations and transitions to the components we just created",
        icon: "enhance",
        priority: "medium",
        category: "enhancement",
      },
      {
        id: "improve-responsiveness",
        title: "Improve Mobile Responsiveness",
        description: "Ensure the layout works perfectly on all screen sizes",
        prompt: "Make the current components fully responsive for mobile, tablet, and desktop",
        icon: "style",
        priority: "medium",
        category: "enhancement",
      },
      {
        id: "add-dark-mode",
        title: "Add Dark Mode Support",
        description: "Implement dark mode styling for better accessibility",
        prompt: "Add dark mode support to all the components",
        icon: "style",
        priority: "low",
        category: "feature",
      }
    );
  }

  if (context.currentFeature) {
    // Feature-specific suggestions
    steps.push(
      {
        id: "add-validation",
        title: "Add Form Validation",
        description: "Implement client-side and server-side validation",
        prompt: `Add comprehensive form validation to the ${context.currentFeature} feature`,
        icon: "fix",
        priority: "high",
        category: "feature",
      },
      {
        id: "add-loading-states",
        title: "Add Loading States",
        description: "Show loading indicators for async operations",
        prompt: "Add loading states and skeletons for better UX during data fetching",
        icon: "enhance",
        priority: "medium",
        category: "enhancement",
      }
    );
  }

  // Always available suggestions
  steps.push(
    {
      id: "add-tests",
      title: "Add Unit Tests",
      description: "Write tests to ensure code reliability",
      prompt: "Create unit tests for the components we've built",
      icon: "test",
      priority: "low",
      category: "testing",
    },
    {
      id: "optimize-performance",
      title: "Optimize Performance",
      description: "Improve loading speed and runtime efficiency",
      prompt: "Analyze and optimize the performance of our code - reduce bundle size and improve runtime",
      icon: "optimize",
      priority: "low",
      category: "optimization",
    },
    {
      id: "add-accessibility",
      title: "Improve Accessibility",
      description: "Ensure WCAG compliance and keyboard navigation",
      prompt: "Improve accessibility with proper ARIA labels, keyboard navigation, and screen reader support",
      icon: "enhance",
      priority: "medium",
      category: "enhancement",
    }
  );

  // Limit to top 5 most relevant
  return steps.slice(0, 5);
}

// Pre-built step sets for common scenarios
export const commonNextSteps = {
  afterLandingPage: [
    {
      id: "add-cta-section",
      title: "Add Call-to-Action Section",
      description: "Create a compelling CTA section with email capture",
      prompt: "Add a call-to-action section with an email signup form and social proof",
      icon: "add" as const,
      priority: "high" as const,
      category: "feature" as const,
    },
    {
      id: "add-testimonials",
      title: "Add Testimonials Section",
      description: "Display customer reviews and social proof",
      prompt: "Create a testimonials section with customer quotes, photos, and ratings",
      icon: "add" as const,
      priority: "medium" as const,
      category: "feature" as const,
    },
    {
      id: "add-pricing",
      title: "Add Pricing Table",
      description: "Show pricing tiers with feature comparison",
      prompt: "Add a pricing section with 3 tiers, feature lists, and signup buttons",
      icon: "add" as const,
      priority: "medium" as const,
      category: "feature" as const,
    },
    {
      id: "add-faq",
      title: "Add FAQ Section",
      description: "Answer common questions with an accordion",
      prompt: "Create an FAQ section with expandable questions and answers",
      icon: "add" as const,
      priority: "low" as const,
      category: "feature" as const,
    },
    {
      id: "add-footer",
      title: "Add Footer",
      description: "Complete the page with a professional footer",
      prompt: "Add a footer with navigation links, social icons, and newsletter signup",
      icon: "add" as const,
      priority: "low" as const,
      category: "feature" as const,
    },
  ],
  afterDashboard: [
    {
      id: "add-charts",
      title: "Add Interactive Charts",
      description: "Visualize data with dynamic charts and graphs",
      prompt: "Add interactive charts showing key metrics - line charts, bar charts, and pie charts",
      icon: "add" as const,
      priority: "high" as const,
      category: "feature" as const,
    },
    {
      id: "add-data-table",
      title: "Add Data Table",
      description: "Display data with sorting, filtering, and pagination",
      prompt: "Create a data table component with sorting, filtering, search, and pagination",
      icon: "add" as const,
      priority: "high" as const,
      category: "feature" as const,
    },
    {
      id: "add-sidebar-nav",
      title: "Improve Navigation",
      description: "Add collapsible sidebar with nested menus",
      prompt: "Enhance the sidebar navigation with collapsible sections and active state indicators",
      icon: "enhance" as const,
      priority: "medium" as const,
      category: "enhancement" as const,
    },
  ],
  afterForm: [
    {
      id: "add-validation",
      title: "Add Form Validation",
      description: "Validate inputs with helpful error messages",
      prompt: "Add comprehensive form validation with real-time feedback and error messages",
      icon: "fix" as const,
      priority: "high" as const,
      category: "feature" as const,
    },
    {
      id: "add-submit-handler",
      title: "Add Form Submission",
      description: "Handle form submission with API integration",
      prompt: "Implement form submission with loading state, success message, and error handling",
      icon: "integrate" as const,
      priority: "high" as const,
      category: "feature" as const,
    },
  ],
};