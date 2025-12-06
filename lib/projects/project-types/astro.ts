/**
 * Astro Project Type Configuration
 * 
 * Astro is a modern web framework for building fast, content-focused websites.
 * It supports multiple UI frameworks (React, Vue, Svelte, etc.) through integrations.
 */

import type { ProjectTypeConfig } from '../project-type';

export const astroConfig: ProjectTypeConfig = {
  id: 'astro',
  name: 'Astro',
  description: 'Build fast, content-focused websites with Astro. Supports React, Vue, Svelte, and more.',
  
  // === File Structure ===
  sourceDir: 'src',
  componentsDir: 'src/components',
  pagesDir: 'src/pages',
  apiDir: 'src/pages/api', // API routes use file-based routing in pages
  publicDir: 'public',
  
  // === Build Configuration ===
  devCommand: 'npm run dev',
  buildCommand: 'npm run build',
  devPort: 4321, // Astro's default port
  startupDelay: 8000,
  
  // === Dependencies ===
  baseDependencies: {
    'astro': '^4.11.0',
    '@astrojs/react': '^3.6.0',
    '@astrojs/tailwind': '^5.1.0',
    'react': '^18.3.1',
    'react-dom': '^18.3.1',
    'tailwindcss': '^3.4.4'
  },
  baseDevDependencies: {
    '@types/react': '^18.3.3',
    '@types/react-dom': '^18.3.0',
    'typescript': '^5.5.2'
  },
  
  // === Entry Files ===
  entryFiles: [
    {
      path: 'src/pages/index.astro',
      content: `---
// Welcome to Astro! Everything between these code fences is your component's "component script"
import Layout from '../layouts/Layout.astro';
import Card from '../components/Card.astro';
---

<Layout title="Welcome to Astro">
  <main class="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white px-8 py-16">
    <div class="max-w-4xl mx-auto">
      <h1 class="text-5xl font-bold text-center mb-8">
        Welcome to <span class="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-pink-600">Astro</span>
      </h1>
      <p class="text-xl text-gray-300 text-center mb-12">
        Build fast websites, faster.
      </p>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card
          title="Documentation"
          body="Learn how Astro works and explore the official API docs."
          href="https://docs.astro.build/"
        />
        <Card
          title="Integrations"
          body="Add React, Vue, Svelte, Tailwind, and more to your project."
          href="https://astro.build/integrations/"
        />
      </div>
    </div>
  </main>
</Layout>
`
    },
    {
      path: 'src/layouts/Layout.astro',
      content: `---
interface Props {
  title: string;
}

const { title } = Astro.props;
---

<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="description" content="Astro application" />
    <meta name="viewport" content="width=device-width" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <title>{title}</title>
  </head>
  <body class="antialiased">
    <slot />
  </body>
</html>
`
    },
    {
      path: 'src/components/Card.astro',
      content: `---
interface Props {
  title: string;
  body: string;
  href: string;
}

const { href, title, body } = Astro.props;
---

<a
  href={href}
  class="block p-6 bg-gray-800/50 rounded-xl border border-gray-700 hover:border-orange-500 transition-colors group"
>
  <h2 class="text-xl font-semibold mb-2 group-hover:text-orange-400 transition-colors">
    {title}
    <span class="inline-block transition-transform group-hover:translate-x-1">&rarr;</span>
  </h2>
  <p class="text-gray-400">
    {body}
  </p>
</a>
`
    },
    {
      path: 'src/styles/global.css',
      content: `@tailwind base;
@tailwind components;
@tailwind utilities;
`
    },
    {
      path: 'src/pages/api/hello.ts',
      content: `import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ request }) => {
  return new Response(
    JSON.stringify({
      message: 'Hello from Astro API!',
      timestamp: new Date().toISOString(),
    }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );
};

export const POST: APIRoute = async ({ request }) => {
  const body = await request.json();
  
  return new Response(
    JSON.stringify({
      received: body,
      message: 'Data received successfully',
    }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );
};
`
    }
  ],
  
  // === Configuration Files ===
  configFiles: [
    {
      path: 'astro.config.mjs',
      content: `import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import react from '@astrojs/react';

// https://astro.build/config
export default defineConfig({
  integrations: [
    tailwind(),
    react()
  ],
  output: 'server', // Enable SSR for API routes
});
`
    },
    {
      path: 'tailwind.config.mjs',
      content: `/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {},
  },
  plugins: [],
};
`
    },
    {
      path: 'tsconfig.json',
      content: `{
  "extends": "astro/tsconfigs/strict",
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  }
}
`
    },
    {
      path: 'package.json',
      content: `{
  "name": "astro-app",
  "type": "module",
  "version": "0.0.1",
  "scripts": {
    "dev": "astro dev",
    "start": "astro dev",
    "build": "astro build",
    "preview": "astro preview",
    "astro": "astro"
  },
  "dependencies": {
    "@astrojs/react": "^3.6.0",
    "@astrojs/tailwind": "^5.1.0",
    "astro": "^4.11.0",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "tailwindcss": "^3.4.4"
  },
  "devDependencies": {
    "@types/react": "^18.3.3",
    "@types/react-dom": "^18.3.0",
    "typescript": "^5.5.2"
  }
}
`
    },
    {
      path: 'public/favicon.svg',
      content: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 128 128">
  <path d="M50.4 78.5a75.1 75.1 0 0 0-28.5 6.9l24.2-65.7c.7-2 1.9-3.2 3.4-3.2h29c1.5 0 2.7 1.2 3.4 3.2l24.2 65.7s-11.6-7-28.5-7L67 45.5c-.4-1.7-1.6-2.8-2.9-2.8-1.3 0-2.5 1.1-2.9 2.8L50.4 78.5z" fill="#fff"/>
  <path d="M79.5 78.5a75.1 75.1 0 0 1 28.5 6.9l-24.2-65.7c-.7-2-1.9-3.2-3.4-3.2h-29c-1.5 0-2.7 1.2-3.4 3.2l-24.2 65.7s11.6-7 28.5-7l11.2-33c.4-1.7 1.6-2.8 2.9-2.8 1.3 0 2.5 1.1 2.9 2.8l11.2 33z" fill="url(#gradient)"/>
  <defs>
    <linearGradient id="gradient" x1="79.6" y1="16.5" x2="50.4" y2="95.5" gradientUnits="userSpaceOnUse">
      <stop stop-color="#000014"/>
      <stop offset="1" stop-color="#150426"/>
    </linearGradient>
  </defs>
</svg>
`
    }
  ],
  
  // === Path Transformation ===
  filePathTransform: (path: string): string => {
    // Remove leading slash if present
    let normalized = path.startsWith('/') ? path.slice(1) : path;
    
    // Handle Vite-style paths
    if (normalized.startsWith('src/components/')) {
      // Already correct for Astro
      return normalized;
    }
    
    // Convert app/ style paths to src/pages/
    if (normalized.startsWith('app/')) {
      return normalized.replace('app/', 'src/pages/');
    }
    
    // Handle components/ without src/
    if (normalized.startsWith('components/')) {
      return 'src/' + normalized;
    }
    
    // Default: ensure it's in src/
    if (!normalized.startsWith('src/') && !normalized.startsWith('public/')) {
      return 'src/' + normalized;
    }
    
    return normalized;
  },
  
  componentExtension: '.astro',
  
  // === Templates ===
  componentTemplate: `---
interface Props {
  // Define your props here
}

const { } = Astro.props;
---

<div class="component">
  <!-- Your component content here -->
</div>

<style>
  /* Component-scoped styles */
</style>
`,
  
  pageTemplate: `---
import Layout from '../layouts/Layout.astro';
---

<Layout title="Page Title">
  <main class="container mx-auto px-4 py-8">
    <h1 class="text-4xl font-bold mb-6">Page Title</h1>
    <!-- Page content -->
  </main>
</Layout>
`,
  
  apiRouteTemplate: `import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ request, params }) => {
  return new Response(
    JSON.stringify({
      message: 'Hello from API',
    }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );
};
`,
  
  // === Capabilities ===
  supportsApiRoutes: true,
  supportsSSR: true,
  usesTypeScript: true
};