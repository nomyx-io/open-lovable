"use client";

import { forwardRef, ReactNode } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export interface PremiumButtonProps {
  variant?: "primary" | "secondary" | "ghost" | "outline" | "danger";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  shine?: boolean;
  glow?: boolean;
  className?: string;
  disabled?: boolean;
  children?: ReactNode;
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
}

const variants = {
  primary: "bg-gradient-to-r from-orange-500 via-orange-500 to-red-500 text-white shadow-lg shadow-orange-500/25 hover:shadow-xl hover:shadow-orange-500/30",
  secondary: "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700",
  ghost: "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800",
  outline: "border-2 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-orange-500 hover:text-orange-500",
  danger: "bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg shadow-red-500/25 hover:shadow-xl hover:shadow-red-500/30",
};

const sizes = {
  sm: "px-3 py-1.5 text-sm rounded-lg gap-1.5",
  md: "px-4 py-2.5 text-sm rounded-xl gap-2",
  lg: "px-6 py-3.5 text-base rounded-2xl gap-2.5",
};

const PremiumButton = forwardRef<HTMLButtonElement, PremiumButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      isLoading = false,
      leftIcon,
      rightIcon,
      shine = true,
      glow = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || isLoading;

    return (
      <motion.button
        ref={ref}
        whileHover={!isDisabled ? { scale: 1.02, y: -1 } : {}}
        whileTap={!isDisabled ? { scale: 0.98 } : {}}
        className={cn(
          "relative inline-flex items-center justify-center font-semibold transition-all duration-200 overflow-hidden",
          "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-400 dark:focus:ring-offset-gray-900",
          variants[variant],
          sizes[size],
          isDisabled && "opacity-50 cursor-not-allowed pointer-events-none",
          className
        )}
        disabled={isDisabled}
        {...props}
      >
        {/* Shimmer effect for primary/danger variants */}
        {shine && !isDisabled && (variant === "primary" || variant === "danger") && (
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
            initial={{ x: "-100%" }}
            animate={{ x: "200%" }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear", repeatDelay: 1 }}
          />
        )}

        {/* Glow effect */}
        {glow && !isDisabled && (
          <motion.div
            className="absolute inset-0 rounded-inherit bg-gradient-to-r from-orange-400 to-red-400 opacity-0"
            animate={{ opacity: [0, 0.3, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        )}

        {/* Loading spinner */}
        {isLoading && (
          <motion.div
            className="absolute inset-0 flex items-center justify-center bg-inherit"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <motion.div
              className="w-5 h-5 border-2 border-current border-t-transparent rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            />
          </motion.div>
        )}

        {/* Content */}
        <span className={cn("relative flex items-center gap-inherit", isLoading && "opacity-0")}>
          {leftIcon}
          {children}
          {rightIcon}
        </span>
      </motion.button>
    );
  }
);

PremiumButton.displayName = "PremiumButton";

export { PremiumButton };