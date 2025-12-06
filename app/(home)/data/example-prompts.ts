export interface ExamplePrompt {
  icon: string;
  title: string;
  prompt: string;
}

export const examplePrompts: ExamplePrompt[] = [
  {
    icon: "🛍️",
    title: "E-commerce store",
    prompt: "Build a modern e-commerce landing page with a hero section, featured products grid, testimonials, and a newsletter signup"
  },
  {
    icon: "📊",
    title: "SaaS dashboard",
    prompt: "Create a SaaS dashboard with sidebar navigation, analytics cards, charts, and a data table"
  },
  {
    icon: "📝",
    title: "Blog platform",
    prompt: "Design a minimalist blog with a featured post hero, article grid, category filters, and dark mode"
  },
  {
    icon: "🎨",
    title: "Portfolio site",
    prompt: "Build a creative portfolio with an animated hero, project gallery, about section, and contact form"
  },
  {
    icon: "🏢",
    title: "Company website",
    prompt: "Create a professional company website with team section, services, case studies, and contact page"
  },
  {
    icon: "📱",
    title: "Mobile app landing",
    prompt: "Design an app landing page with phone mockups, feature highlights, pricing table, and download buttons"
  }
];