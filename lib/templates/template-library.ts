/**
 * Template Library - Pre-built templates for common patterns
 */

import { createChildLogger } from '@/lib/logger';
import type { Template, TemplateCategory, TemplateQueryOptions, TemplateFile } from './types';

const logger = createChildLogger('template-library');

// Built-in templates
const BUILT_IN_TEMPLATES: Template[] = [
  {
    id: 'hero-landing-v1',
    name: 'Hero Landing Page',
    description: 'Modern landing page with hero section, features, testimonials, and CTA',
    thumbnail: '/templates/hero-landing.png',
    category: 'landing',
    tags: ['hero', 'modern', 'gradient', 'saas'],
    dependencies: ['lucide-react', 'framer-motion'],
    aiPrompt: 'A modern SaaS landing page with gradient hero section, feature grid, testimonials, and call-to-action',
    createdAt: new Date('2024-01-01'),
    popularity: 95,
    files: [
      {
        path: 'src/App.jsx',
        content: `import Header from './components/Header';
import Hero from './components/Hero';
import Features from './components/Features';
import Testimonials from './components/Testimonials';
import CTA from './components/CTA';
import Footer from './components/Footer';

export default function App() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <Hero />
      <Features />
      <Testimonials />
      <CTA />
      <Footer />
    </div>
  );
}`,
      },
      {
        path: 'src/components/Hero.jsx',
        content: `export default function Hero() {
  return (
    <section className="relative py-20 overflow-hidden bg-gradient-to-br from-indigo-600 to-purple-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
            Build Something Amazing
          </h1>
          <p className="text-xl text-indigo-100 mb-8 max-w-2xl mx-auto">
            The modern platform for building incredible products faster.
          </p>
          <div className="flex justify-center gap-4">
            <button className="px-8 py-3 bg-white text-indigo-600 rounded-lg font-semibold hover:bg-indigo-50 transition">
              Get Started
            </button>
            <button className="px-8 py-3 bg-transparent border-2 border-white text-white rounded-lg font-semibold hover:bg-white/10 transition">
              Learn More
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}`,
      },
    ],
  },
  {
    id: 'dashboard-admin-v1',
    name: 'Admin Dashboard',
    description: 'Clean admin dashboard with sidebar, stats, and data tables',
    thumbnail: '/templates/dashboard-admin.png',
    category: 'dashboard',
    tags: ['admin', 'sidebar', 'stats', 'table'],
    dependencies: ['lucide-react', 'recharts'],
    aiPrompt: 'A clean admin dashboard with collapsible sidebar, stat cards, and data tables',
    createdAt: new Date('2024-01-15'),
    popularity: 88,
    files: [
      {
        path: 'src/App.jsx',
        content: `import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';

export default function App() {
  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />
      <main className="flex-1 p-8">
        <Dashboard />
      </main>
    </div>
  );
}`,
      },
    ],
  },
  {
    id: 'portfolio-minimal-v1',
    name: 'Minimal Portfolio',
    description: 'Clean, minimalist portfolio for developers and designers',
    thumbnail: '/templates/portfolio-minimal.png',
    category: 'portfolio',
    tags: ['minimal', 'portfolio', 'personal', 'projects'],
    dependencies: ['framer-motion'],
    aiPrompt: 'A minimalist portfolio website with about section, project gallery, and contact form',
    createdAt: new Date('2024-02-01'),
    popularity: 82,
    files: [
      {
        path: 'src/App.jsx',
        content: `import About from './components/About';
import Projects from './components/Projects';
import Contact from './components/Contact';

export default function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <About />
      <Projects />
      <Contact />
    </div>
  );
}`,
      },
    ],
  },
  {
    id: 'ecommerce-product-v1',
    name: 'Product Page',
    description: 'E-commerce product page with gallery, variants, and cart',
    thumbnail: '/templates/ecommerce-product.png',
    category: 'ecommerce',
    tags: ['product', 'gallery', 'cart', 'variants'],
    dependencies: ['lucide-react', 'zustand'],
    aiPrompt: 'An e-commerce product page with image gallery, size/color variants, and add to cart',
    createdAt: new Date('2024-02-15'),
    popularity: 78,
    files: [
      {
        path: 'src/App.jsx',
        content: `import ProductPage from './components/ProductPage';

export default function App() {
  return <ProductPage />;
}`,
      },
    ],
  },
  {
    id: 'blog-modern-v1',
    name: 'Modern Blog',
    description: 'Clean blog layout with featured posts and categories',
    thumbnail: '/templates/blog-modern.png',
    category: 'blog',
    tags: ['blog', 'posts', 'categories', 'modern'],
    dependencies: ['date-fns'],
    aiPrompt: 'A modern blog with featured post hero, post grid, and category sidebar',
    createdAt: new Date('2024-03-01'),
    popularity: 75,
    files: [
      {
        path: 'src/App.jsx',
        content: `import BlogLayout from './components/BlogLayout';

export default function App() {
  return <BlogLayout />;
}`,
      },
    ],
  },
  {
    id: 'saas-pricing-v1',
    name: 'SaaS Pricing Page',
    description: 'Pricing page with tiers, features comparison, and FAQ',
    thumbnail: '/templates/saas-pricing.png',
    category: 'saas',
    tags: ['pricing', 'tiers', 'comparison', 'faq'],
    dependencies: ['lucide-react'],
    aiPrompt: 'A SaaS pricing page with three tiers, feature comparison table, and FAQ accordion',
    createdAt: new Date('2024-03-15'),
    popularity: 85,
    files: [
      {
        path: 'src/App.jsx',
        content: `import PricingHero from './components/PricingHero';
import PricingTiers from './components/PricingTiers';
import FeatureComparison from './components/FeatureComparison';
import FAQ from './components/FAQ';

export default function App() {
  return (
    <div className="min-h-screen bg-white">
      <PricingHero />
      <PricingTiers />
      <FeatureComparison />
      <FAQ />
    </div>
  );
}`,
      },
    ],
  },
];

class TemplateLibrary {
  private templates: Map<string, Template>;
  private customTemplates: Map<string, Template>;

  constructor() {
    this.templates = new Map(BUILT_IN_TEMPLATES.map(t => [t.id, t]));
    this.customTemplates = new Map();
  }

  getTemplate(id: string): Template | null {
    return this.templates.get(id) || this.customTemplates.get(id) || null;
  }

  listTemplates(options: TemplateQueryOptions = {}): Template[] {
    let templates = [...this.templates.values(), ...this.customTemplates.values()];

    if (options.category) {
      templates = templates.filter(t => t.category === options.category);
    }

    if (options.tags && options.tags.length > 0) {
      templates = templates.filter(t => 
        options.tags!.some(tag => t.tags.includes(tag))
      );
    }

    if (options.search) {
      const search = options.search.toLowerCase();
      templates = templates.filter(t =>
        t.name.toLowerCase().includes(search) ||
        t.description.toLowerCase().includes(search)
      );
    }

    const sortBy = options.sortBy || 'popularity';
    templates.sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'createdAt') return b.createdAt.getTime() - a.createdAt.getTime();
      return b.popularity - a.popularity;
    });

    if (options.limit) {
      templates = templates.slice(0, options.limit);
    }

    return templates;
  }

  getCategories(): Array<{ id: TemplateCategory; name: string; count: number }> {
    const categories: Record<TemplateCategory, number> = {
      landing: 0,
      dashboard: 0,
      ecommerce: 0,
      portfolio: 0,
      blog: 0,
      saas: 0,
    };

    for (const template of [...this.templates.values(), ...this.customTemplates.values()]) {
      categories[template.category]++;
    }

    const names: Record<TemplateCategory, string> = {
      landing: 'Landing Pages',
      dashboard: 'Dashboards',
      ecommerce: 'E-commerce',
      portfolio: 'Portfolios',
      blog: 'Blogs',
      saas: 'SaaS',
    };

    return Object.entries(categories).map(([id, count]) => ({
      id: id as TemplateCategory,
      name: names[id as TemplateCategory],
      count,
    }));
  }

  addCustomTemplate(template: Omit<Template, 'createdAt' | 'popularity'>): Template {
    const fullTemplate: Template = {
      ...template,
      createdAt: new Date(),
      popularity: 0,
    };
    this.customTemplates.set(template.id, fullTemplate);
    logger.info({ templateId: template.id }, 'Custom template added');
    return fullTemplate;
  }

  removeCustomTemplate(id: string): boolean {
    const result = this.customTemplates.delete(id);
    if (result) {
      logger.info({ templateId: id }, 'Custom template removed');
    }
    return result;
  }

  getPopularTemplates(limit: number = 6): Template[] {
    return this.listTemplates({ sortBy: 'popularity', limit });
  }

  getTemplatesByCategory(category: TemplateCategory): Template[] {
    return this.listTemplates({ category });
  }
}

let libraryInstance: TemplateLibrary | null = null;

export function getTemplateLibrary(): TemplateLibrary {
  if (!libraryInstance) {
    libraryInstance = new TemplateLibrary();
  }
  return libraryInstance;
}

export default getTemplateLibrary;