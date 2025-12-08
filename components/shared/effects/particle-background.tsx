"use client";

import { useCallback, useMemo, useEffect, useState } from "react";
import Particles, { initParticlesEngine } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";
import type { ISourceOptions } from "@tsparticles/engine";

interface ParticleBackgroundProps {
  variant?: "stars" | "fireflies" | "network" | "snow" | "bubbles";
  className?: string;
  opacity?: number;
}

export function ParticleBackground({
  variant = "stars",
  className = "",
  opacity = 0.6
}: ParticleBackgroundProps) {
  const [init, setInit] = useState(false);

  useEffect(() => {
    initParticlesEngine(async (engine) => {
      await loadSlim(engine);
    }).then(() => {
      setInit(true);
    });
  }, []);

  const options = useMemo((): ISourceOptions => {
    const baseOptions: ISourceOptions = {
      background: {
        color: {
          value: "transparent",
        },
      },
      fpsLimit: 60,
      detectRetina: true,
    };

    switch (variant) {
      case "stars":
        return {
          ...baseOptions,
          particles: {
            number: {
              value: 100,
              density: { enable: true, width: 1920, height: 1080 },
            },
            color: { value: ["#ffffff", "#f97316", "#ef4444"] },
            opacity: {
              value: { min: 0.1, max: opacity },
              animation: { enable: true, speed: 0.5, sync: false },
            },
            size: {
              value: { min: 0.5, max: 2 },
              animation: { enable: true, speed: 2, sync: false },
            },
            move: {
              enable: true,
              speed: 0.3,
              direction: "none",
              random: true,
              straight: false,
              outModes: { default: "out" },
            },
            twinkle: {
              particles: { enable: true, frequency: 0.05, opacity: 1 },
            },
          },
          interactivity: {
            events: {
              onHover: { enable: true, mode: "grab" },
            },
            modes: {
              grab: { distance: 150, links: { opacity: 0.3, color: "#f97316" } },
            },
          },
        };

      case "fireflies":
        return {
          ...baseOptions,
          particles: {
            number: { value: 40 },
            color: { value: ["#f97316", "#fbbf24", "#ef4444"] },
            opacity: {
              value: { min: 0.2, max: opacity },
              animation: { enable: true, speed: 1, sync: false },
            },
            size: {
              value: { min: 2, max: 4 },
              animation: { enable: true, speed: 3, sync: false },
            },
            move: {
              enable: true,
              speed: 1,
              direction: "none",
              random: true,
              straight: false,
              outModes: { default: "bounce" },
              attract: { enable: true, rotate: { x: 600, y: 1200 } },
            },
            shadow: {
              enable: true,
              color: "#f97316",
              blur: 10,
            },
          },
        };

      case "network":
        return {
          ...baseOptions,
          particles: {
            number: { value: 60, density: { enable: true, width: 1920, height: 1080 } },
            color: { value: "#f97316" },
            opacity: { value: opacity * 0.5 },
            size: { value: 2 },
            links: {
              enable: true,
              distance: 150,
              color: "#f97316",
              opacity: 0.2,
              width: 1,
            },
            move: {
              enable: true,
              speed: 1,
              direction: "none",
              random: false,
              straight: false,
              outModes: { default: "bounce" },
            },
          },
          interactivity: {
            events: {
              onHover: { enable: true, mode: "repulse" },
            },
            modes: {
              repulse: { distance: 100, duration: 0.4 },
            },
          },
        };

      case "snow":
        return {
          ...baseOptions,
          particles: {
            number: { value: 80 },
            color: { value: "#ffffff" },
            opacity: { value: { min: 0.3, max: opacity } },
            size: { value: { min: 1, max: 4 } },
            move: {
              enable: true,
              speed: 1.5,
              direction: "bottom",
              random: true,
              straight: false,
              outModes: { default: "out" },
              gravity: { enable: true, acceleration: 0.2 },
            },
            wobble: {
              enable: true,
              distance: 10,
              speed: 5,
            },
          },
        };

      case "bubbles":
        return {
          ...baseOptions,
          particles: {
            number: { value: 30 },
            color: { value: ["#f97316", "#3b82f6", "#8b5cf6", "#10b981"] },
            opacity: { value: { min: 0.1, max: opacity * 0.4 } },
            size: { value: { min: 20, max: 60 } },
            move: {
              enable: true,
              speed: 0.5,
              direction: "top",
              random: true,
              straight: false,
              outModes: { default: "out" },
            },
            stroke: { width: 1, color: { value: "#ffffff", animation: { enable: true, speed: 1, sync: false } } },
          },
        };

      default:
        return baseOptions;
    }
  }, [variant, opacity]);

  if (!init) {
    return null;
  }

  return (
    <Particles
      id="tsparticles"
      className={`fixed inset-0 -z-10 ${className}`}
      options={options}
    />
  );
}