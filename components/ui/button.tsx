import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { motion, HTMLMotionProps } from "framer-motion"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-gray-900 text-white hover:bg-gray-800 shadow-md hover:shadow-lg focus-visible:ring-gray-400",
        secondary: "bg-gray-100 text-gray-900 hover:bg-gray-200 shadow-sm hover:shadow focus-visible:ring-gray-300",
        outline: "border-2 border-gray-200 bg-white text-gray-900 hover:bg-gray-50 hover:border-gray-300 focus-visible:ring-gray-300",
        destructive: "bg-red-500 text-white hover:bg-red-600 shadow-md shadow-red-200 hover:shadow-lg hover:shadow-red-300 focus-visible:ring-red-400",
        success: "bg-green-500 text-white hover:bg-green-600 shadow-md shadow-green-200 hover:shadow-lg hover:shadow-green-300 focus-visible:ring-green-400",
        warning: "bg-amber-500 text-white hover:bg-amber-600 shadow-md shadow-amber-200 hover:shadow-lg hover:shadow-amber-300 focus-visible:ring-amber-400",
        code: "bg-gray-800 text-white hover:bg-gray-700 shadow-md focus-visible:ring-gray-500 font-mono",
        orange: "bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:from-orange-600 hover:to-orange-700 shadow-md shadow-orange-200 hover:shadow-lg hover:shadow-orange-300 focus-visible:ring-orange-400",
        ghost: "hover:bg-gray-100 text-gray-700 hover:text-gray-900",
        link: "text-orange-600 underline-offset-4 hover:underline hover:text-orange-700",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 px-3 py-1.5 text-xs",
        lg: "h-12 px-6 py-3 text-base",
        xl: "h-14 px-8 py-4 text-lg",
        icon: "h-10 w-10 p-2",
        "icon-sm": "h-8 w-8 p-1.5",
        "icon-lg": "h-12 w-12 p-3",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  loading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading = false, leftIcon, rightIcon, children, disabled, ...props }, ref) => {
    const isDisabled = disabled || loading
    
    return (
      <motion.button
        whileHover={!isDisabled ? { scale: 1.02 } : {}}
        whileTap={!isDisabled ? { scale: 0.98 } : {}}
        transition={{ duration: 0.15, ease: [0.4, 0, 0.2, 1] }}
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref as React.Ref<HTMLButtonElement>}
        disabled={isDisabled}
        {...(props as HTMLMotionProps<"button">)}
      >
        {/* Loading spinner */}
        {loading && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"
          />
        )}
        
        {/* Left icon */}
        {!loading && leftIcon && (
          <span className="flex-shrink-0">{leftIcon}</span>
        )}
        
        {/* Content */}
        <span className={loading ? 'opacity-0' : ''}>{children}</span>
        
        {/* Right icon */}
        {!loading && rightIcon && (
          <span className="flex-shrink-0">{rightIcon}</span>
        )}
      </motion.button>
    )
  }
)
Button.displayName = "Button"

// Icon button variant for icon-only buttons
const IconButton = React.forwardRef<HTMLButtonElement, Omit<ButtonProps, 'leftIcon' | 'rightIcon'>>(
  ({ className, variant = "ghost", size = "icon", children, ...props }, ref) => {
    return (
      <Button
        ref={ref}
        variant={variant}
        size={size}
        className={cn("rounded-lg", className)}
        {...props}
      >
        {children}
      </Button>
    )
  }
)
IconButton.displayName = "IconButton"

export { Button, IconButton, buttonVariants }