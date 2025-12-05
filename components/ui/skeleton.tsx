'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
  variant?: 'default' | 'circle' | 'rounded' | 'text';
  animation?: 'pulse' | 'shimmer' | 'wave';
  style?: React.CSSProperties;
}

export function Skeleton({
  className,
  variant = 'default',
  animation = 'shimmer',
  style
}: SkeletonProps) {
  const baseClasses = 'bg-gray-200 relative overflow-hidden';
  
  const variantClasses = {
    default: 'rounded-md',
    circle: 'rounded-full',
    rounded: 'rounded-xl',
    text: 'rounded h-4 w-full'
  };

  const animationClasses = {
    pulse: 'animate-pulse',
    shimmer: '',
    wave: ''
  };

  if (animation === 'shimmer') {
    return (
      <div className={cn(baseClasses, variantClasses[variant], className)} style={style}>
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent"
          animate={{ x: ['-100%', '100%'] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
        />
      </div>
    );
  }

  if (animation === 'wave') {
    return (
      <div className={cn(baseClasses, variantClasses[variant], className)} style={style}>
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200"
          animate={{ backgroundPosition: ['200% 0', '-200% 0'] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          style={{ backgroundSize: '200% 100%' }}
        />
      </div>
    );
  }

  return (
    <div className={cn(baseClasses, variantClasses[variant], animationClasses[animation], className)} style={style} />
  );
}

// Preset skeleton components for common patterns
export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn('space-y-3 p-4 bg-white rounded-xl border border-gray-100', className)}>
      <Skeleton className="h-32 w-full" variant="rounded" />
      <Skeleton className="h-4 w-3/4" variant="text" />
      <Skeleton className="h-4 w-1/2" variant="text" />
    </div>
  );
}

export function SkeletonAvatar({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-12 w-12'
  };
  return <Skeleton className={sizeClasses[size]} variant="circle" />;
}

export function SkeletonText({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton 
          key={i} 
          className="h-4" 
          variant="text" 
          style={{ width: i === lines - 1 ? '60%' : '100%' } as React.CSSProperties}
        />
      ))}
    </div>
  );
}

export function SkeletonButton({ className }: { className?: string }) {
  return <Skeleton className={cn('h-10 w-24', className)} variant="rounded" />;
}

export function SkeletonMessage({ isUser = false }: { isUser?: boolean }) {
  return (
    <div className={cn('flex gap-3', isUser ? 'flex-row-reverse' : 'flex-row')}>
      {!isUser && <SkeletonAvatar size="sm" />}
      <div className={cn('flex-1 space-y-2', isUser ? 'items-end' : 'items-start')}>
        <Skeleton 
          className={cn('h-16', isUser ? 'ml-auto w-3/4' : 'mr-auto w-4/5')} 
          variant="rounded" 
        />
      </div>
    </div>
  );
}

export function SkeletonFileList({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
          <Skeleton className="h-8 w-8" variant="rounded" />
          <div className="flex-1 space-y-1">
            <Skeleton className="h-3 w-1/2" variant="text" />
            <Skeleton className="h-2 w-1/4" variant="text" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function SkeletonPreview() {
  return (
    <div className="w-full h-full bg-gray-50 rounded-xl overflow-hidden">
      {/* Browser chrome skeleton */}
      <div className="h-10 bg-gray-100 border-b border-gray-200 flex items-center gap-2 px-3">
        <div className="flex gap-1.5">
          <Skeleton className="h-3 w-3" variant="circle" animation="pulse" />
          <Skeleton className="h-3 w-3" variant="circle" animation="pulse" />
          <Skeleton className="h-3 w-3" variant="circle" animation="pulse" />
        </div>
        <Skeleton className="h-6 flex-1 mx-4" variant="rounded" />
      </div>
      
      {/* Content skeleton */}
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-1/3" variant="rounded" />
        <SkeletonText lines={4} />
        <div className="grid grid-cols-3 gap-4 pt-4">
          <Skeleton className="h-24" variant="rounded" />
          <Skeleton className="h-24" variant="rounded" />
          <Skeleton className="h-24" variant="rounded" />
        </div>
      </div>
    </div>
  );
}