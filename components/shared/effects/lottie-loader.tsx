"use client";

import { useEffect, useState } from "react";
import Lottie from "lottie-react";
import { motion } from "framer-motion";

// Simple loading animation data (inline to avoid external dependencies)
const loadingAnimationData = {
  v: "5.7.4",
  fr: 30,
  ip: 0,
  op: 60,
  w: 100,
  h: 100,
  nm: "Loading",
  ddd: 0,
  assets: [],
  layers: [
    {
      ddd: 0,
      ind: 1,
      ty: 4,
      nm: "Circle 1",
      sr: 1,
      ks: {
        o: { a: 1, k: [{ t: 0, s: [100], h: 0 }, { t: 30, s: [30], h: 0 }, { t: 60, s: [100], h: 0 }] },
        r: { a: 0, k: 0 },
        p: { a: 0, k: [50, 50, 0] },
        a: { a: 0, k: [0, 0, 0] },
        s: { a: 1, k: [{ t: 0, s: [100, 100, 100], h: 0 }, { t: 30, s: [80, 80, 100], h: 0 }, { t: 60, s: [100, 100, 100], h: 0 }] }
      },
      ao: 0,
      shapes: [
        {
          ty: "el",
          s: { a: 0, k: [40, 40] },
          p: { a: 0, k: [0, 0] },
          nm: "Ellipse"
        },
        {
          ty: "fl",
          c: { a: 0, k: [0.976, 0.451, 0.086, 1] },
          o: { a: 0, k: 100 },
          r: 1,
          bm: 0,
          nm: "Fill"
        }
      ]
    }
  ]
};

// Bouncing dots animation data
const bouncingDotsData = {
  v: "5.7.4",
  fr: 60,
  ip: 0,
  op: 60,
  w: 120,
  h: 40,
  nm: "Dots",
  ddd: 0,
  assets: [],
  layers: [
    {
      ddd: 0, ind: 1, ty: 4, nm: "Dot1", sr: 1,
      ks: {
        o: { a: 0, k: 100 },
        p: { a: 1, k: [
          { t: 0, s: [20, 30, 0], h: 0 },
          { t: 15, s: [20, 10, 0], h: 0 },
          { t: 30, s: [20, 30, 0], h: 0 },
          { t: 60, s: [20, 30, 0], h: 0 }
        ]},
        s: { a: 0, k: [100, 100, 100] }
      },
      shapes: [
        { ty: "el", s: { a: 0, k: [12, 12] }, p: { a: 0, k: [0, 0] } },
        { ty: "fl", c: { a: 0, k: [0.976, 0.451, 0.086, 1] }, o: { a: 0, k: 100 } }
      ]
    },
    {
      ddd: 0, ind: 2, ty: 4, nm: "Dot2", sr: 1,
      ks: {
        o: { a: 0, k: 100 },
        p: { a: 1, k: [
          { t: 0, s: [60, 30, 0], h: 0 },
          { t: 10, s: [60, 30, 0], h: 0 },
          { t: 25, s: [60, 10, 0], h: 0 },
          { t: 40, s: [60, 30, 0], h: 0 },
          { t: 60, s: [60, 30, 0], h: 0 }
        ]},
        s: { a: 0, k: [100, 100, 100] }
      },
      shapes: [
        { ty: "el", s: { a: 0, k: [12, 12] }, p: { a: 0, k: [0, 0] } },
        { ty: "fl", c: { a: 0, k: [0.937, 0.267, 0.267, 1] }, o: { a: 0, k: 100 } }
      ]
    },
    {
      ddd: 0, ind: 3, ty: 4, nm: "Dot3", sr: 1,
      ks: {
        o: { a: 0, k: 100 },
        p: { a: 1, k: [
          { t: 0, s: [100, 30, 0], h: 0 },
          { t: 20, s: [100, 30, 0], h: 0 },
          { t: 35, s: [100, 10, 0], h: 0 },
          { t: 50, s: [100, 30, 0], h: 0 },
          { t: 60, s: [100, 30, 0], h: 0 }
        ]},
        s: { a: 0, k: [100, 100, 100] }
      },
      shapes: [
        { ty: "el", s: { a: 0, k: [12, 12] }, p: { a: 0, k: [0, 0] } },
        { ty: "fl", c: { a: 0, k: [0.545, 0.361, 0.965, 1] }, o: { a: 0, k: 100 } }
      ]
    }
  ]
};

type LoaderVariant = "pulse" | "dots" | "spinner" | "progress";

interface LottieLoaderProps {
  variant?: LoaderVariant;
  size?: "sm" | "md" | "lg" | "xl";
  text?: string;
  className?: string;
}

const sizeClasses = {
  sm: "w-8 h-8",
  md: "w-12 h-12",
  lg: "w-16 h-16",
  xl: "w-24 h-24",
};

export function LottieLoader({
  variant = "pulse",
  size = "md",
  text,
  className = "",
}: LottieLoaderProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className={`flex flex-col items-center gap-3 ${className}`}>
        <div className={`${sizeClasses[size]} bg-orange-500/20 rounded-full animate-pulse`} />
        {text && <span className="text-sm text-gray-500">{text}</span>}
      </div>
    );
  }

  const renderLoader = () => {
    switch (variant) {
      case "pulse":
        return (
          <div className={sizeClasses[size]}>
            <Lottie 
              animationData={loadingAnimationData} 
              loop 
              autoplay
              style={{ width: "100%", height: "100%" }}
            />
          </div>
        );

      case "dots":
        return (
          <div className={size === "sm" ? "w-16 h-6" : size === "md" ? "w-24 h-8" : size === "lg" ? "w-32 h-10" : "w-40 h-12"}>
            <Lottie 
              animationData={bouncingDotsData} 
              loop 
              autoplay
              style={{ width: "100%", height: "100%" }}
            />
          </div>
        );

      case "spinner":
        return (
          <motion.div
            className={`${sizeClasses[size]} border-4 border-gray-200 dark:border-gray-700 border-t-orange-500 rounded-full`}
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
        );

      case "progress":
        return (
          <div className={`${size === "sm" ? "w-24" : size === "md" ? "w-32" : size === "lg" ? "w-48" : "w-64"} h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden`}>
            <motion.div
              className="h-full bg-gradient-to-r from-orange-500 to-red-500 rounded-full"
              initial={{ x: "-100%" }}
              animate={{ x: "100%" }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className={`flex flex-col items-center gap-3 ${className}`}>
      {renderLoader()}
      {text && (
        <motion.span
          className="text-sm text-gray-500 dark:text-gray-400"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {text}
        </motion.span>
      )}
    </div>
  );
}

// Full page loader overlay
export function PageLoader({ text = "Loading..." }: { text?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm z-50 flex items-center justify-center"
    >
      <div className="flex flex-col items-center gap-4">
        <LottieLoader variant="dots" size="lg" />
        <p className="text-lg font-medium text-gray-700 dark:text-gray-300">{text}</p>
      </div>
    </motion.div>
  );
}

// Skeleton loader component
export function SkeletonLoader({
  className = "",
  variant = "rect",
}: {
  className?: string;
  variant?: "rect" | "circle" | "text";
}) {
  const baseClass = "animate-pulse bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 bg-[length:200%_100%]";
  
  switch (variant) {
    case "circle":
      return <div className={`${baseClass} rounded-full ${className}`} style={{ animation: "shimmer 2s infinite" }} />;
    case "text":
      return <div className={`${baseClass} rounded h-4 ${className}`} style={{ animation: "shimmer 2s infinite" }} />;
    default:
      return <div className={`${baseClass} rounded-lg ${className}`} style={{ animation: "shimmer 2s infinite" }} />;
  }
}