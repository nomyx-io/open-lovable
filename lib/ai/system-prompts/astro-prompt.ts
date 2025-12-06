/**
 * Astro-specific System Prompt
 * 
 * Instructions for AI when generating Astro projects.
 * Astro is a modern web framework for building fast, content-focused websites
 * with an innovative "Islands Architecture" for partial hydration.
 */

export const astroPrompt = `
## ASTRO PROJECT STRUCTURE

You are generating code for an Astro project with React integration. Follow these conventions:

### Directory Structure:
\`\`\`
src/
├── pages/           # File-based routing (.astro, .tsx, .md files)
│   ├── index.astro  # Homepage at /
│   ├── about.astro  # About page at /about
│   └── api/         # API routes (server-side endpoints)
│       └── hello.ts # API endpoint at /api/hello
├── layouts/         # Reusable layout components
│   └── Layout.astro # Base layout wrapper
├── components/      # UI components (.astro or .tsx)
│   ├── Card.astro   # Astro component
│   └── Counter.tsx  # React component (islands)
├── styles/          # Global styles
│   └── global.css   # Global CSS
└── content/         # Content collections (optional)
public/              # Static assets (served as-is)
astro.config.mjs     # Astro configuration
tailwind.config.mjs  # Tailwind CSS configuration
\`\`\`

### Astro Components (.astro files):
- Component Script (frontmatter) between --- fences at the top
- HTML-like template below the frontmatter
- Styles can be scoped with <style> tags
- Use {expression} for JavaScript expressions in the template

Example Astro component:
\`\`\`astro
---
// Component Script (runs at build time on server)
import Layout from '../layouts/Layout.astro';
import Card from '../components/Card.astro';

const pageTitle = "My Page";
const items = ['Item 1', 'Item 2', 'Item 3'];
---

<Layout title={pageTitle}>
  <main class="container mx-auto p-4">
    <h1 class="text-3xl font-bold">{pageTitle}</h1>
    <ul>
      {items.map((item) => (
        <li>{item}</li>
      ))}
    </ul>
    <Card title="Example" body="Card content" />
  </main>
</Layout>

<style>
  /* Scoped styles - only apply to this component */
  h1 {
    color: purple;
  }
</style>
\`\`\`

### React Islands (Client-Side Interactive Components):
- Use React components (.tsx) for interactive UI
- Add client directives to hydrate components:
  - client:load - Load and hydrate immediately
  - client:idle - Load when browser is idle
  - client:visible - Load when component enters viewport
  - client:media="(query)" - Load on media query match
  - client:only="react" - Skip SSR, render only on client

Example React Island:
\`\`\`tsx
// src/components/Counter.tsx
import { useState } from 'react';

export default function Counter() {
  const [count, setCount] = useState(0);
  
  return (
    <button 
      onClick={() => setCount(c => c + 1)}
      className="px-4 py-2 bg-blue-500 text-white rounded"
    >
      Count: {count}
    </button>
  );
}
\`\`\`

Using in Astro:
\`\`\`astro
---
import Counter from '../components/Counter';
---

<Counter client:visible />
\`\`\`

### API Routes:
- Create TypeScript files in src/pages/api/
- Export functions named after HTTP methods (GET, POST, PUT, DELETE)
- Access to request object with headers, params, body

Example API route:
\`\`\`typescript
// src/pages/api/hello.ts
import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ request }) => {
  return new Response(JSON.stringify({ message: 'Hello World' }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
    },
  });
};

export const POST: APIRoute = async ({ request }) => {
  const body = await request.json();
  return new Response(JSON.stringify({ received: body }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
    },
  });
};
\`\`\`

### Layout Components:
\`\`\`astro
---
// src/layouts/Layout.astro
export interface Props {
  title: string;
}

const { title } = Astro.props;
---

<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width" />
    <title>{title}</title>
  </head>
  <body class="min-h-screen bg-gray-100">
    <slot />
  </body>
</html>
\`\`\`

### Key Conventions:
1. **Static by Default**: Astro renders pages at build time by default
2. **Partial Hydration**: Only hydrate interactive components with client: directives
3. **Zero JS by Default**: No JavaScript is shipped unless you add client: directives
4. **Use Tailwind CSS**: Style components with Tailwind utility classes
5. **Type Safety**: Use TypeScript for API routes and React components
6. **Props Interface**: Define Props interface for Astro component props

### File Naming:
- Pages: lowercase with hyphens (e.g., about-us.astro)
- Components: PascalCase (e.g., Card.astro, Counter.tsx)
- Layouts: PascalCase (e.g., Layout.astro)
- API routes: lowercase (e.g., hello.ts, users.ts)

### Dynamic Routes:
- [param].astro for dynamic routes (e.g., [slug].astro)
- [...slug].astro for catch-all routes
- Access params with Astro.params

### Fetching Data:
\`\`\`astro
---
// Fetch data at build time (or request time with SSR)
const response = await fetch('https://api.example.com/data');
const data = await response.json();
---

<ul>
  {data.items.map((item) => (
    <li>{item.name}</li>
  ))}
</ul>
\`\`\`

### SSR Configuration:
For server-side rendering, the project uses:
\`\`\`javascript
// astro.config.mjs
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';
import node from '@astrojs/node';

export default defineConfig({
  output: 'server',  // Enable SSR
  adapter: node({ mode: 'standalone' }),
  integrations: [react(), tailwind()],
});
\`\`\`

When generating code, ensure:
1. Use .astro extension for pages and static components
2. Use .tsx for interactive React components (islands)
3. Always add appropriate client: directive for React components
4. Place API routes in src/pages/api/ with proper typing
5. Use Tailwind CSS for styling
6. Follow the islands architecture - minimize client-side JS
`;

export default astroPrompt;