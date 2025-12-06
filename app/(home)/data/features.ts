export interface Feature {
  icon: "lightning" | "globe" | "download";
  title: string;
  description: string;
  colorClass: string;
  shadowClass: string;
  hoverColorClass: string;
}

export const features: Feature[] = [
  {
    icon: "lightning",
    title: "Lightning Fast",
    description: "Generate complete websites in seconds, not hours. Describe your vision and watch the magic happen.",
    colorClass: "from-orange-500 to-red-500",
    shadowClass: "shadow-orange-500/25",
    hoverColorClass: "group-hover:text-orange-600 dark:group-hover:text-orange-400"
  },
  {
    icon: "globe",
    title: "Clone Any Site",
    description: "Paste a URL in the chat and AI will analyze and recreate the design for you instantly.",
    colorClass: "from-blue-500 to-cyan-500",
    shadowClass: "shadow-blue-500/25",
    hoverColorClass: "group-hover:text-blue-600 dark:group-hover:text-blue-400"
  },
  {
    icon: "download",
    title: "Export & Deploy",
    description: "Download as ZIP or deploy directly. Production-ready React code at your fingertips.",
    colorClass: "from-green-500 to-emerald-500",
    shadowClass: "shadow-green-500/25",
    hoverColorClass: "group-hover:text-green-600 dark:group-hover:text-green-400"
  }
];