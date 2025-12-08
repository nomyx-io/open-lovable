"use client";

import { forwardRef, ReactNode, HTMLAttributes } from "react";
import { motion, HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";

export interface PremiumCardProps {
  variant?: "default" | "elevated" | "outlined" | "glass" | "gradient";
  size?: "sm" | "md" | "lg";
  hover?: boolean;
  glow?: boolean;
  className?: string;
  children?: ReactNode;
  onClick?: () => void;
}

const variants = {
  default: "bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-700/80",
  elevated: "bg-white dark:bg-gray-900 shadow-lg shadow-black/5 dark:shadow-black/20 border border-gray-100 dark:border-gray-800",
  outlined: "border-2 border-gray-200 dark:border-gray-700 bg-transparent",
  glass: "bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl border border-white/20 dark:border-gray-700/50",
  gradient: "bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 border border-gray-200/50 dark:border-gray-700/50",
};

const sizes = {
  sm: "p-4 rounded-xl",
  md: "p-6 rounded-2xl",
  lg: "p-8 rounded-3xl",
};

const hoverStyles = {
  default: "hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-md",
  elevated: "hover:shadow-xl hover:shadow-black/10 dark:hover:shadow-black/30 hover:-translate-y-0.5",
  outlined: "hover:border-orange-500 dark:hover:border-orange-400",
  glass: "hover:bg-white/80 dark:hover:bg-gray-900/80 hover:shadow-lg",
  gradient: "hover:shadow-lg hover:shadow-orange-500/10",
};

const PremiumCard = forwardRef<HTMLDivElement, PremiumCardProps>(
  (
    {
      variant = "default",
      size = "md",
      hover = true,
      glow = false,
      className,
      children,
      onClick,
    },
    ref
  ) => {
    return (
      <motion.div
        ref={ref}
        whileHover={hover ? { scale: 1.01 } : {}}
        whileTap={onClick ? { scale: 0.99 } : {}}
        className={cn(
          "relative transition-all duration-300",
          variants[variant],
          sizes[size],
          hover && hoverStyles[variant],
          onClick && "cursor-pointer",
          className
        )}
        onClick={onClick}
      >
        {/* Glow effect */}
        {glow && (
          <div className="absolute -inset-0.5 bg-gradient-to-r from-orange-500 to-red-500 rounded-inherit opacity-0 group-hover:opacity-20 blur transition-opacity duration-300 -z-10" />
        )}
        
        {children}
      </motion.div>
    );
  }
);

PremiumCard.displayName = "PremiumCard";

// Sub-components for structured content
const PremiumCardHeader = ({ className, children }: { className?: string; children: ReactNode }) => (
  <div className={cn("mb-4", className)}>{children}</div>
);

const PremiumCardTitle = ({ className, children }: { className?: string; children: ReactNode }) => (
  <h3 className={cn("text-lg font-semibold text-gray-900 dark:text-white", className)}>{children}</h3>
);

const PremiumCardDescription = ({ className, children }: { className?: string; children: ReactNode }) => (
  <p className={cn("text-sm text-gray-500 dark:text-gray-400 mt-1", className)}>{children}</p>
);

const PremiumCardContent = ({ className, children }: { className?: string; children: ReactNode }) => (
  <div className={cn("", className)}>{children}</div>
);

const PremiumCardFooter = ({ className, children }: { className?: string; children: ReactNode }) => (
  <div className={cn("mt-4 pt-4 border-t border-gray-100 dark:border-gray-800", className)}>{children}</div>
);

export {
  PremiumCard,
  PremiumCardHeader,
  PremiumCardTitle,
  PremiumCardDescription,
  PremiumCardContent,
  PremiumCardFooter,
};