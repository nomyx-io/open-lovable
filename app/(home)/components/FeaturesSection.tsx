"use client";

import { motion } from "framer-motion";
import { features, type Feature } from "../data";
import { FeatureIcon } from "./icons";

export function FeaturesSection() {
  return (
    <section className="relative z-10 py-16 lg:py-24 bg-gradient-to-b from-transparent to-gray-50/50 dark:to-gray-800/30">
      <div className="container px-4 lg:px-16">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.8 }}
          className="max-w-5xl mx-auto"
        >
          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
            className="text-center text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white mb-4"
          >
            Everything you need to build fast
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.0 }}
            className="text-center text-gray-600 dark:text-gray-400 mb-12 max-w-2xl mx-auto"
          >
            From idea to deployed website in minutes, not days
          </motion.p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-10">
            {features.map((feature, index) => (
              <FeatureCard
                key={feature.title}
                feature={feature}
                index={index}
              />
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

interface FeatureCardProps {
  feature: Feature;
  index: number;
}

function FeatureCard({ feature, index }: FeatureCardProps) {
  const hoverShadowClass = feature.icon === "lightning" 
    ? "hover:shadow-orange-500/5" 
    : feature.icon === "globe" 
    ? "hover:shadow-blue-500/5"
    : "hover:shadow-green-500/5";

  return (
    <motion.div
      className={`group text-center p-6 rounded-2xl bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 hover:shadow-xl ${hoverShadowClass} transition-all duration-300`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1.1 + index * 0.1 }}
      whileHover={{ y: -4 }}
    >
      <motion.div
        className={`w-14 h-14 mx-auto mb-5 rounded-2xl bg-gradient-to-br ${feature.colorClass} flex items-center justify-center shadow-lg ${feature.shadowClass}`}
        whileHover={{ scale: 1.1, rotate: 5 }}
        transition={{ type: "spring", stiffness: 400 }}
      >
        <FeatureIcon type={feature.icon} className="w-7 h-7 text-white" />
      </motion.div>
      <h3 className={`font-bold text-lg text-gray-900 dark:text-white mb-3 ${feature.hoverColorClass} transition-colors`}>
        {feature.title}
      </h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
        {feature.description}
      </p>
    </motion.div>
  );
}