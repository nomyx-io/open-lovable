"use client";

import { ReactNode } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export interface PremiumBadgeProps {
  variant?: "default" | "primary" | "success" | "warning" | "danger" | "info" | "gradient";
  size?: "xs" | "sm" | "md" | "lg";
  dot?: boolean;
  pulse?: boolean;
  className?: string;
  children?: ReactNode;
}

const variants = {
  default: "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700",
  primary: "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 border border-orange-200/50 dark:border-orange-800/50",
  success: "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200/50 dark:border-green-800/50",
  warning: "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 border border-yellow-200/50 dark:border-yellow-800/50",
  danger: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-200/50 dark:border-red-800/50",
  info: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border border-blue-200/50 dark:border-blue-800/50",
  gradient: "bg-gradient-to-r from-orange-500 to-red-500 text-white border-0 shadow-sm shadow-orange-500/25",
};

const sizes = {
  xs: "text-[10px] px-1.5 py-0.5 rounded",
  sm: "text-xs px-2 py-0.5 rounded-md",
  md: "text-sm px-2.5 py-1 rounded-lg",
  lg: "text-sm px-3 py-1.5 rounded-xl",
};

const dotColors = {
  default: "bg-gray-500",
  primary: "bg-orange-500",
  success: "bg-green-500",
  warning: "bg-yellow-500",
  danger: "bg-red-500",
  info: "bg-blue-500",
  gradient: "bg-white",
};

export function PremiumBadge({
  variant = "default",
  size = "sm",
  dot = false,
  pulse = false,
  className,
  children,
}: PremiumBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 font-medium transition-all duration-200",
        variants[variant],
        sizes[size],
        className
      )}
    >
      {dot && (
        <span className="relative flex">
          <span className={cn("w-1.5 h-1.5 rounded-full", dotColors[variant])} />
          {pulse && (
            <motion.span
              className={cn("absolute inset-0 w-1.5 h-1.5 rounded-full", dotColors[variant])}
              animate={{ scale: [1, 1.5, 1], opacity: [1, 0, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
          )}
        </span>
      )}
      {children}
    </span>
  );
}

// Status badge with predefined configurations
export interface StatusBadgeProps {
  status: "online" | "offline" | "busy" | "away" | "pending" | "success" | "error";
  className?: string;
}

const statusConfig = {
  online: { variant: "success" as const, dot: true, pulse: true, label: "Online" },
  offline: { variant: "default" as const, dot: true, pulse: false, label: "Offline" },
  busy: { variant: "danger" as const, dot: true, pulse: true, label: "Busy" },
  away: { variant: "warning" as const, dot: true, pulse: false, label: "Away" },
  pending: { variant: "info" as const, dot: true, pulse: true, label: "Pending" },
  success: { variant: "success" as const, dot: true, pulse: false, label: "Success" },
  error: { variant: "danger" as const, dot: true, pulse: false, label: "Error" },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status];
  return (
    <PremiumBadge
      variant={config.variant}
      dot={config.dot}
      pulse={config.pulse}
      className={className}
    >
      {config.label}
    </PremiumBadge>
  );
}