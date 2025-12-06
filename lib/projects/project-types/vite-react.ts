/**
 * Vite + React Project Type Configuration
 * 
 * This is the default project type, extracted from the existing behavior
 * to maintain backwards compatibility.
 */

import type { ProjectTypeConfig, ProjectTypeFile } from '../project-type';

// Entry files for Vite + React
const entryFiles: ProjectTypeFile[] = [
  {
    path: 'src/main.jsx',
    content: `import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)`
  },
  {
    path: 'src/App.jsx',
    content: `function App() {
  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-4">
      <div className="text-center max-w-2xl">
        <h1 className="text-4xl font-bold mb-4">Sandbox Ready</h1>
        <p className="text-lg text-gray-400">
          Start building your React app with Vite and Tailwind CSS!
        </p>
      </div>
    </div>
  )
}

export default App`
  },
  {
    path: 'src/index.css',
    content: `@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
  background-color: rgb(17 24 39);
}`
  },
  {
    path: 'index.html',
    content: `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Sandbox App</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>`
  }
];

// Config files for Vite + React
const configFiles: ProjectTypeFile[] = [
  {
    path: 'package.json',
    content: JSON.stringify({
      name: 'sandbox-app',
      version: '1.0.0',
      type: 'module',
      scripts: {
        dev: 'vite --host',
        build: 'vite build',
        preview: 'vite preview'
      },
      dependencies: {
        react: '^18.2.0',
        'react-dom': '^18.2.0'
      },
      devDependencies: {
        '@vitejs/plugin-react': '^4.0.0',
        vite: '^4.3.9',
        tailwindcss: '^3.3.0',
        postcss: '^8.4.31',
        autoprefixer: '^10.4.16'
      }
    }, null, 2)
  },
  {
    path: 'vite.config.js',
    content: `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    hmr: false,
    allowedHosts: ['.e2b.app', '.e2b.dev', '.vercel.run', 'localhost', '127.0.0.1']
  }
})`
  },
  {
    path: 'tailwind.config.js',
    content: `/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}`
  },
  {
    path: 'postcss.config.js',
    content: `export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}`
  }
];

export const viteReactConfig: ProjectTypeConfig = {
  id: 'vite-react',
  name: 'Vite + React',
  description: 'Fast, modern React app with Vite bundler and Tailwind CSS',
  
  // File structure
  sourceDir: 'src',
  componentsDir: 'src/components',
  pagesDir: null,
  apiDir: null,
  publicDir: 'public',
  
  // Build configuration
  devCommand: 'npm run dev',
  buildCommand: 'npm run build',
  devPort: 5173,
  startupDelay: 10000,
  
  // Dependencies
  baseDependencies: {
    'react': '^18.2.0',
    'react-dom': '^18.2.0'
  },
  
  baseDevDependencies: {
    '@vitejs/plugin-react': '^4.0.0',
    'vite': '^4.3.9',
    'tailwindcss': '^3.3.0',
    'postcss': '^8.4.31',
    'autoprefixer': '^10.4.16'
  },
  
  // Entry files
  entryFiles,
  configFiles,
  
  // Path transformation - for Vite, ensure paths start with src/
  filePathTransform: (path: string): string => {
    if (path.startsWith('/')) path = path.slice(1);
    
    // Don't transform paths already in correct locations
    if (path.startsWith('src/') || path.startsWith('public/') || path === 'index.html') {
      return path;
    }
    
    // Skip config files
    const configFileNames = ['package.json', 'vite.config.js', 'tailwind.config.js', 'postcss.config.js'];
    if (configFileNames.includes(path)) {
      return path;
    }
    
    // Move everything else to src/
    return `src/${path}`;
  },
  
  componentExtension: '.jsx',
  
  // Templates
  componentTemplate: `export default function {{name}}() {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold">{{name}}</h1>
    </div>
  );
}`,
  
  pageTemplate: null,
  apiRouteTemplate: null,
  
  // Capabilities
  supportsApiRoutes: false,
  supportsSSR: false,
  usesTypeScript: false
};

export default viteReactConfig;