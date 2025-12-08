import { Sandbox } from '@e2b/code-interpreter';
import { SandboxProvider, SandboxInfo, CommandResult } from '../types';
// SandboxProviderConfig available through parent class
import { appConfig } from '@/config/app.config';

export class E2BProvider extends SandboxProvider {
  private existingFiles: Set<string> = new Set();

  /**
   * Attempt to reconnect to an existing E2B sandbox
   */
  async reconnect(sandboxId: string): Promise<boolean> {
    try {
      
      // Try to connect to existing sandbox
      // Note: E2B SDK doesn't directly support reconnection, but we can try to recreate
      // For now, return false to indicate reconnection isn't supported
      // In the future, E2B may add this capability
      
      return false;
    } catch (error) {
      console.error(`[E2BProvider] Failed to reconnect to sandbox ${sandboxId}:`, error);
      return false;
    }
  }

  async createSandbox(): Promise<SandboxInfo> {
    try {
      
      // Kill existing sandbox if any
      if (this.sandbox) {
        try {
          await this.sandbox.kill();
        } catch (e) {
          console.error('Failed to close existing sandbox:', e);
        }
        this.sandbox = null;
      }
      
      // Clear existing files tracking
      this.existingFiles.clear();

      // Create base sandbox
      this.sandbox = await Sandbox.create({ 
        apiKey: this.config.e2b?.apiKey || process.env.E2B_API_KEY,
        timeoutMs: this.config.e2b?.timeoutMs || appConfig.e2b.timeoutMs
      });
      
      const sandboxId = (this.sandbox as any).sandboxId || Date.now().toString();
      const host = (this.sandbox as any).getHost(appConfig.e2b.vitePort);
      

      this.sandboxInfo = {
        sandboxId,
        url: `https://${host}`,
        provider: 'e2b',
        createdAt: new Date()
      };

      // Set extended timeout on the sandbox instance if method available
      if (typeof this.sandbox.setTimeout === 'function') {
        this.sandbox.setTimeout(appConfig.e2b.timeoutMs);
      }

      return this.sandboxInfo;

    } catch (error) {
      console.error('[E2BProvider] Error creating sandbox:', error);
      throw error;
    }
  }

  async runCommand(command: string): Promise<CommandResult> {
    if (!this.sandbox) {
      throw new Error('No active sandbox');
    }

    
    const result = await this.sandbox.runCode(`
      import subprocess
      import os

      os.chdir('/home/user/app')
      result = subprocess.run(${JSON.stringify(command.split(' '))}, 
                            capture_output=True, 
                            text=True, 
                            shell=False)

      print("STDOUT:")
      print(result.stdout)
      if result.stderr:
          print("\\nSTDERR:")
          print(result.stderr)
      print(f"\\nReturn code: {result.returncode}")
    `);
    
    const output = result.logs.stdout.join('\n');
    const stderr = result.logs.stderr.join('\n');
    
    return {
      stdout: output,
      stderr,
      exitCode: result.error ? 1 : 0,
      success: !result.error
    };
  }

  async writeFile(path: string, content: string): Promise<void> {
    if (!this.sandbox) {
      throw new Error('No active sandbox');
    }

    const fullPath = path.startsWith('/') ? path : `/home/user/app/${path}`;
    
    // Use the E2B filesystem API to write the file
    // Note: E2B SDK uses files.write() method
    if ((this.sandbox as any).files && typeof (this.sandbox as any).files.write === 'function') {
      // Use the files.write API if available
      await (this.sandbox as any).files.write(fullPath, Buffer.from(content));
    } else {
      // Fallback to Python code execution
      await this.sandbox.runCode(`
        import os

        # Ensure directory exists
        dir_path = os.path.dirname("${fullPath}")
        os.makedirs(dir_path, exist_ok=True)

        # Write file
        with open("${fullPath}", 'w') as f:
            f.write(${JSON.stringify(content)})
        print(f"✓ Written: ${fullPath}")
      `);
    }
    
    this.existingFiles.add(path);
  }

  async readFile(path: string): Promise<string> {
    if (!this.sandbox) {
      throw new Error('No active sandbox');
    }

    const fullPath = path.startsWith('/') ? path : `/home/user/app/${path}`;
    
    const result = await this.sandbox.runCode(`
      with open("${fullPath}", 'r') as f:
          content = f.read()
      print(content)
    `);
    
    return result.logs.stdout.join('\n');
  }

  async listFiles(directory: string = '/home/user/app'): Promise<string[]> {
    if (!this.sandbox) {
      throw new Error('No active sandbox');
    }

    const result = await this.sandbox.runCode(`
      import os
      import json

      def list_files(path):
          files = []
          for root, dirs, filenames in os.walk(path):
              # Skip node_modules and .git
              dirs[:] = [d for d in dirs if d not in ['node_modules', '.git', '.next', 'dist', 'build']]
              for filename in filenames:
                  rel_path = os.path.relpath(os.path.join(root, filename), path)
                  files.append(rel_path)
          return files

      files = list_files("${directory}")
      print(json.dumps(files))
    `);
    
    try {
      return JSON.parse(result.logs.stdout.join(''));
    } catch {
      return [];
    }
  }

  async installPackages(packages: string[]): Promise<CommandResult> {
    if (!this.sandbox) {
      throw new Error('No active sandbox');
    }

    const packageList = packages.join(' ');
    const flags = appConfig.packages.useLegacyPeerDeps ? '--legacy-peer-deps' : '';
    
    
    const result = await this.sandbox.runCode(`
      import subprocess
      import os

      os.chdir('/home/user/app')

      # Install packages
      result = subprocess.run(
          ['npm', 'install', ${flags ? `'${flags}',` : ''} ${packages.map(p => `'${p}'`).join(', ')}],
          capture_output=True,
          text=True
      )

      print("STDOUT:")
      print(result.stdout)
      if result.stderr:
          print("\\nSTDERR:")
          print(result.stderr)
      print(f"\\nReturn code: {result.returncode}")
    `);
    
    const output = result.logs.stdout.join('\n');
    const stderr = result.logs.stderr.join('\n');
    
    // Restart Vite if configured
    if (appConfig.packages.autoRestartVite && !result.error) {
      await this.restartViteServer();
    }
    
    return {
      stdout: output,
      stderr,
      exitCode: result.error ? 1 : 0,
      success: !result.error
    };
  }

  async setupViteApp(): Promise<void> {
    if (!this.sandbox) {
      throw new Error('No active sandbox');
    }

    
    // Write all files in a single Python script
    const setupScript = `
import os
import json

print('Setting up React app with Vite and Tailwind...')

# Create directory structure
os.makedirs('/home/user/app/src', exist_ok=True)

# Package.json
package_json = {
    "name": "sandbox-app",
    "version": "1.0.0",
    "type": "module",
    "scripts": {
        "dev": "vite --host",
        "build": "vite build",
        "preview": "vite preview"
    },
    "dependencies": {
        "react": "^18.2.0",
        "react-dom": "^18.2.0"
    },
    "devDependencies": {
        "@vitejs/plugin-react": "^4.0.0",
        "vite": "^4.3.9",
        "tailwindcss": "^3.3.0",
        "postcss": "^8.4.31",
        "autoprefixer": "^10.4.16"
    }
}

with open('/home/user/app/package.json', 'w') as f:
    json.dump(package_json, f, indent=2)
print('✓ package.json')

# Vite config - with HMR enabled for error detection
vite_config = """import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    hmr: {
      protocol: 'wss',
      host: process.env.SANDBOX_HOST || '0.0.0.0'
    },
    allowedHosts: ['.e2b.app', '.e2b.dev', '.vercel.run', 'localhost', '127.0.0.1']
  }
})"""

with open('/home/user/app/vite.config.js', 'w') as f:
    f.write(vite_config)
print('✓ vite.config.js')

# Tailwind config
tailwind_config = """/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}"""

with open('/home/user/app/tailwind.config.js', 'w') as f:
    f.write(tailwind_config)
print('✓ tailwind.config.js')

# PostCSS config
postcss_config = """export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}"""

with open('/home/user/app/postcss.config.js', 'w') as f:
    f.write(postcss_config)
print('✓ postcss.config.js')

# Index.html
index_html = """<!DOCTYPE html>
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
</html>"""

with open('/home/user/app/index.html', 'w') as f:
    f.write(index_html)
print('✓ index.html')

# Main.jsx
main_jsx = """import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)"""

with open('/home/user/app/src/main.jsx', 'w') as f:
    f.write(main_jsx)
print('✓ src/main.jsx')

# App.jsx
app_jsx = """function App() {
  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-4">
      <div className="text-center max-w-2xl">
        <p className="text-lg text-gray-400">
          Sandbox Ready<br/>
          Start building your React app with Vite and Tailwind CSS!
        </p>
      </div>
    </div>
  )
}

export default App"""

with open('/home/user/app/src/App.jsx', 'w') as f:
    f.write(app_jsx)
print('✓ src/App.jsx')

# Index.css
index_css = """@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
  background-color: rgb(17 24 39);
}"""

with open('/home/user/app/src/index.css', 'w') as f:
    f.write(index_css)
print('✓ src/index.css')

print('\\nAll files created successfully!')
`;

    await this.sandbox.runCode(setupScript);
    
    // Install dependencies
    await this.sandbox.runCode(`
import subprocess

print('Installing npm packages...')
result = subprocess.run(
    ['npm', 'install'],
    cwd='/home/user/app',
    capture_output=True,
    text=True
)

if result.returncode == 0:
    print('✓ Dependencies installed successfully')
else:
    print(f'⚠ Warning: npm install had issues: {result.stderr}')
    `);
    
    // Start Vite dev server with log capture
    await this.sandbox.runCode(`
import subprocess
import os
import time

os.chdir('/home/user/app')

# Kill any existing Vite processes
subprocess.run(['pkill', '-f', 'vite'], capture_output=True)
time.sleep(1)

# Create log file
log_file = open('/tmp/vite-output.log', 'w')

# Start Vite dev server with logs captured to file
env = os.environ.copy()
env['FORCE_COLOR'] = '0'

process = subprocess.Popen(
    ['npm', 'run', 'dev'],
    stdout=log_file,
    stderr=subprocess.STDOUT,
    env=env
)

print(f'✓ Vite dev server started with PID: {process.pid}')
print('Logs will be written to /tmp/vite-output.log')
print('Waiting for server to be ready...')
    `);
    
    // Wait for Vite to be ready
    await new Promise(resolve => setTimeout(resolve, appConfig.e2b.viteStartupDelay));
    
    // Track initial files
    this.existingFiles.add('src/App.jsx');
    this.existingFiles.add('src/main.jsx');
    this.existingFiles.add('src/index.css');
    this.existingFiles.add('index.html');
    this.existingFiles.add('package.json');
    this.existingFiles.add('vite.config.js');
    this.existingFiles.add('tailwind.config.js');
    this.existingFiles.add('postcss.config.js');
  }

  async restartViteServer(): Promise<void> {
    if (!this.sandbox) {
      throw new Error('No active sandbox');
    }

    
    await this.sandbox.runCode(`
import subprocess
import time
import os

os.chdir('/home/user/app')

# Kill existing Vite process
subprocess.run(['pkill', '-f', 'vite'], capture_output=True)
time.sleep(2)

# Clear and create log file
log_file = open('/tmp/vite-output.log', 'w')

# Start Vite dev server with logs captured to file
env = os.environ.copy()
env['FORCE_COLOR'] = '0'

process = subprocess.Popen(
    ['npm', 'run', 'dev'],
    stdout=log_file,
    stderr=subprocess.STDOUT,
    env=env
)

print(f'✓ Vite restarted with PID: {process.pid}')
print('Logs will be written to /tmp/vite-output.log')
    `);
    
    // Wait for Vite to be ready
    await new Promise(resolve => setTimeout(resolve, appConfig.e2b.viteStartupDelay));
  }

  /**
   * Setup a Next.js App Router project
   */
  async setupNextApp(): Promise<void> {
    if (!this.sandbox) {
      throw new Error('No active sandbox');
    }

    console.log('[E2BProvider] Setting up Next.js App Router project...');
    
    // Write all files in a single Python script
    const setupScript = `
import os
import json

print('Setting up Next.js app with App Router...')

# Create directory structure
os.makedirs('/home/user/app/app', exist_ok=True)
os.makedirs('/home/user/app/app/api/hello', exist_ok=True)
os.makedirs('/home/user/app/components', exist_ok=True)
os.makedirs('/home/user/app/public', exist_ok=True)

# Package.json
package_json = {
    "name": "sandbox-nextjs-app",
    "version": "0.1.0",
    "private": True,
    "scripts": {
        "dev": "next dev",
        "build": "next build",
        "start": "next start",
        "lint": "next lint"
    },
    "dependencies": {
        "react": "^18.2.0",
        "react-dom": "^18.2.0",
        "next": "^14.0.0"
    },
    "devDependencies": {
        "typescript": "^5.0.0",
        "@types/react": "^18.2.0",
        "@types/node": "^20.0.0",
        "tailwindcss": "^3.4.0",
        "postcss": "^8.4.0",
        "autoprefixer": "^10.4.0"
    }
}

with open('/home/user/app/package.json', 'w') as f:
    json.dump(package_json, f, indent=2)
print('✓ package.json')

# next.config.js
next_config = """/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
}

module.exports = nextConfig"""

with open('/home/user/app/next.config.js', 'w') as f:
    f.write(next_config)
print('✓ next.config.js')

# tsconfig.json
tsconfig = {
    "compilerOptions": {
        "target": "es5",
        "lib": ["dom", "dom.iterable", "esnext"],
        "allowJs": True,
        "skipLibCheck": True,
        "strict": True,
        "noEmit": True,
        "esModuleInterop": True,
        "module": "esnext",
        "moduleResolution": "bundler",
        "resolveJsonModule": True,
        "isolatedModules": True,
        "jsx": "preserve",
        "incremental": True,
        "plugins": [{"name": "next"}],
        "paths": {"@/*": ["./*"]}
    },
    "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
    "exclude": ["node_modules"]
}

with open('/home/user/app/tsconfig.json', 'w') as f:
    json.dump(tsconfig, f, indent=2)
print('✓ tsconfig.json')

# Tailwind config
tailwind_config = """/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}"""

with open('/home/user/app/tailwind.config.js', 'w') as f:
    f.write(tailwind_config)
print('✓ tailwind.config.js')

# PostCSS config
postcss_config = """module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}"""

with open('/home/user/app/postcss.config.js', 'w') as f:
    f.write(postcss_config)
print('✓ postcss.config.js')

# app/layout.tsx
layout = """import './globals.css'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Sandbox App',
  description: 'Generated by Open Lovable',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  )
}"""

with open('/home/user/app/app/layout.tsx', 'w') as f:
    f.write(layout)
print('✓ app/layout.tsx')

# app/page.tsx
page = """export default function Home() {
  return (
    <main className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-4">
      <div className="text-center max-w-2xl">
        <h1 className="text-4xl font-bold mb-4">Next.js Sandbox Ready</h1>
        <p className="text-lg text-gray-400">
          Start building your Next.js app with App Router and API Routes!
        </p>
      </div>
    </main>
  )
}"""

with open('/home/user/app/app/page.tsx', 'w') as f:
    f.write(page)
print('✓ app/page.tsx')

# app/globals.css
globals_css = """@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
}"""

with open('/home/user/app/app/globals.css', 'w') as f:
    f.write(globals_css)
print('✓ app/globals.css')

# Example API route
api_route = """import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({ message: 'Hello from API!' })
}

export async function POST(request: Request) {
  const body = await request.json()
  return NextResponse.json({ received: body }, { status: 201 })
}"""

with open('/home/user/app/app/api/hello/route.ts', 'w') as f:
    f.write(api_route)
print('✓ app/api/hello/route.ts')

print('\\nAll Next.js files created successfully!')
`;

    await this.sandbox.runCode(setupScript);
    
    // Install dependencies
    console.log('[E2BProvider] Installing Next.js dependencies...');
    await this.sandbox.runCode(`
import subprocess

print('Installing npm packages...')
result = subprocess.run(
    ['npm', 'install'],
    cwd='/home/user/app',
    capture_output=True,
    text=True
)

if result.returncode == 0:
    print('✓ Dependencies installed successfully')
else:
    print(f'⚠ Warning: npm install had issues: {result.stderr}')
    `);
    
    // Start Next.js dev server
    console.log('[E2BProvider] Starting Next.js dev server...');
    await this.sandbox.runCode(`
import subprocess
import os
import time

os.chdir('/home/user/app')

# Kill any existing Next.js processes
subprocess.run(['pkill', '-f', 'next'], capture_output=True)
time.sleep(1)

# Start Next.js dev server
env = os.environ.copy()
env['FORCE_COLOR'] = '0'

process = subprocess.Popen(
    ['npm', 'run', 'dev'],
    stdout=subprocess.PIPE,
    stderr=subprocess.PIPE,
    env=env
)

print(f'✓ Next.js dev server started with PID: {process.pid}')
print('Waiting for server to be ready...')
    `);
    
    // Wait for Next.js to be ready (takes longer than Vite)
    const nextjsStartupDelay = 15000;
    await new Promise(resolve => setTimeout(resolve, nextjsStartupDelay));
    
    // Track initial files
    this.existingFiles.add('app/layout.tsx');
    this.existingFiles.add('app/page.tsx');
    this.existingFiles.add('app/globals.css');
    this.existingFiles.add('app/api/hello/route.ts');
    this.existingFiles.add('components');
    this.existingFiles.add('package.json');
    this.existingFiles.add('next.config.js');
    this.existingFiles.add('tailwind.config.js');
    this.existingFiles.add('postcss.config.js');
    this.existingFiles.add('tsconfig.json');
    
    console.log('[E2BProvider] Next.js App Router project setup complete!');
  }

  /**
   * Setup an Astro project with React integration
   */
  async setupAstroApp(): Promise<void> {
    if (!this.sandbox) {
      throw new Error('No active sandbox');
    }

    console.log('[E2BProvider] Setting up Astro project with React...');
    
    // Write all files in a single Python script
    const setupScript = `
import os
import json

print('Setting up Astro app with React integration...')

# Create directory structure
os.makedirs('/home/user/app/src/pages/api', exist_ok=True)
os.makedirs('/home/user/app/src/layouts', exist_ok=True)
os.makedirs('/home/user/app/src/components', exist_ok=True)
os.makedirs('/home/user/app/src/styles', exist_ok=True)
os.makedirs('/home/user/app/public', exist_ok=True)

# Package.json
package_json = {
    "name": "sandbox-astro-app",
    "type": "module",
    "version": "0.0.1",
    "scripts": {
        "dev": "astro dev --host",
        "start": "astro dev --host",
        "build": "astro build",
        "preview": "astro preview"
    },
    "dependencies": {
        "astro": "^4.0.0",
        "@astrojs/react": "^3.0.0",
        "@astrojs/tailwind": "^5.0.0",
        "@astrojs/node": "^8.0.0",
        "react": "^18.2.0",
        "react-dom": "^18.2.0"
    },
    "devDependencies": {
        "@types/react": "^18.2.0",
        "tailwindcss": "^3.4.0"
    }
}

with open('/home/user/app/package.json', 'w') as f:
    json.dump(package_json, f, indent=2)
print('✓ package.json')

# astro.config.mjs
astro_config = """import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';
import node from '@astrojs/node';

export default defineConfig({
  output: 'server',
  adapter: node({ mode: 'standalone' }),
  integrations: [react(), tailwind()],
  server: {
    host: '0.0.0.0',
    port: 4321
  }
});"""

with open('/home/user/app/astro.config.mjs', 'w') as f:
    f.write(astro_config)
print('✓ astro.config.mjs')

# tsconfig.json
tsconfig = {
    "extends": "astro/tsconfigs/strict",
    "compilerOptions": {
        "jsx": "react-jsx",
        "jsxImportSource": "react"
    }
}

with open('/home/user/app/tsconfig.json', 'w') as f:
    json.dump(tsconfig, f, indent=2)
print('✓ tsconfig.json')

# Tailwind config
tailwind_config = """/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {},
  },
  plugins: [],
}"""

with open('/home/user/app/tailwind.config.mjs', 'w') as f:
    f.write(tailwind_config)
print('✓ tailwind.config.mjs')

# src/layouts/Layout.astro
layout = """---
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
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <meta name="generator" content={Astro.generator} />
    <title>{title}</title>
  </head>
  <body class="min-h-screen bg-gray-900 text-white">
    <slot />
  </body>
</html>

<style is:global>
  @tailwind base;
  @tailwind components;
  @tailwind utilities;
</style>"""

with open('/home/user/app/src/layouts/Layout.astro', 'w') as f:
    f.write(layout)
print('✓ src/layouts/Layout.astro')

# src/pages/index.astro
index_page = """---
import Layout from '../layouts/Layout.astro';
import Card from '../components/Card.astro';
---

<Layout title="Astro Sandbox">
  <main class="flex items-center justify-center min-h-screen p-4">
    <div class="text-center max-w-2xl">
      <h1 class="text-4xl font-bold mb-4">Astro Sandbox Ready</h1>
      <p class="text-lg text-gray-400 mb-8">
        Start building your Astro app with React Islands and API Routes!
      </p>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card
          title="React Islands"
          body="Add interactive React components with client directives"
          href="/docs/islands"
        />
        <Card
          title="API Routes"
          body="Create server-side API endpoints in src/pages/api/"
          href="/api/hello"
        />
      </div>
    </div>
  </main>
</Layout>"""

with open('/home/user/app/src/pages/index.astro', 'w') as f:
    f.write(index_page)
print('✓ src/pages/index.astro')

# src/components/Card.astro
card_component = """---
export interface Props {
  title: string;
  body: string;
  href?: string;
}

const { href, title, body } = Astro.props;
---

<div class="p-6 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors">
  <h2 class="text-xl font-semibold mb-2">{title}</h2>
  <p class="text-gray-400">{body}</p>
  {href && (
    <a
      href={href}
      class="inline-block mt-4 text-blue-400 hover:text-blue-300"
    >
      Learn more →
    </a>
  )}
</div>"""

with open('/home/user/app/src/components/Card.astro', 'w') as f:
    f.write(card_component)
print('✓ src/components/Card.astro')

# src/components/Counter.tsx (React island example)
counter_component = """import { useState } from 'react';

export default function Counter() {
  const [count, setCount] = useState(0);

  return (
    <button
      onClick={() => setCount(c => c + 1)}
      className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg font-medium transition-colors"
    >
      Count: {count}
    </button>
  );
}"""

with open('/home/user/app/src/components/Counter.tsx', 'w') as f:
    f.write(counter_component)
print('✓ src/components/Counter.tsx')

# src/pages/api/hello.ts (API route)
api_route = """import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ request }) => {
  return new Response(JSON.stringify({
    message: 'Hello from Astro API!',
    timestamp: new Date().toISOString()
  }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
    },
  });
};

export const POST: APIRoute = async ({ request }) => {
  const body = await request.json();
  return new Response(JSON.stringify({
    received: body,
    timestamp: new Date().toISOString()
  }), {
    status: 201,
    headers: {
      'Content-Type': 'application/json',
    },
  });
};"""

with open('/home/user/app/src/pages/api/hello.ts', 'w') as f:
    f.write(api_route)
print('✓ src/pages/api/hello.ts')

# public/favicon.svg
favicon = """<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 128 128">
  <path d="M50.4 78.5a75.1 75.1 0 0 0-28.5 6.9l24.2-65.7c.7-2 1.9-3.2 3.4-3.2h29c1.5 0 2.7 1.2 3.4 3.2l24.2 65.7s-11.6-7-28.5-7L64 36.4 50.4 78.5z" fill="#fff"/>
</svg>"""

with open('/home/user/app/public/favicon.svg', 'w') as f:
    f.write(favicon)
print('✓ public/favicon.svg')

print('\\nAll Astro files created successfully!')
`;

    await this.sandbox.runCode(setupScript);
    
    // Install dependencies
    console.log('[E2BProvider] Installing Astro dependencies...');
    await this.sandbox.runCode(`
import subprocess

print('Installing npm packages...')
result = subprocess.run(
    ['npm', 'install'],
    cwd='/home/user/app',
    capture_output=True,
    text=True
)

if result.returncode == 0:
    print('✓ Dependencies installed successfully')
else:
    print(f'⚠ Warning: npm install had issues: {result.stderr}')
    `);
    
    // Start Astro dev server
    console.log('[E2BProvider] Starting Astro dev server...');
    await this.sandbox.runCode(`
import subprocess
import os
import time

os.chdir('/home/user/app')

# Kill any existing Astro processes
subprocess.run(['pkill', '-f', 'astro'], capture_output=True)
time.sleep(1)

# Start Astro dev server
env = os.environ.copy()
env['FORCE_COLOR'] = '0'

process = subprocess.Popen(
    ['npm', 'run', 'dev'],
    stdout=subprocess.PIPE,
    stderr=subprocess.PIPE,
    env=env
)

print(f'✓ Astro dev server started with PID: {process.pid}')
print('Waiting for server to be ready...')
    `);
    
    // Wait for Astro to be ready
    const astroStartupDelay = 12000;
    await new Promise(resolve => setTimeout(resolve, astroStartupDelay));
    
    // Track initial files
    this.existingFiles.add('src/layouts/Layout.astro');
    this.existingFiles.add('src/pages/index.astro');
    this.existingFiles.add('src/components/Card.astro');
    this.existingFiles.add('src/components/Counter.tsx');
    this.existingFiles.add('src/pages/api/hello.ts');
    this.existingFiles.add('public/favicon.svg');
    this.existingFiles.add('package.json');
    this.existingFiles.add('astro.config.mjs');
    this.existingFiles.add('tailwind.config.mjs');
    this.existingFiles.add('tsconfig.json');
    
    console.log('[E2BProvider] Astro project setup complete!');
  }

  /**
   * Restart the Astro dev server
   */
  async restartAstroServer(): Promise<void> {
    if (!this.sandbox) {
      throw new Error('No active sandbox');
    }

    console.log('[E2BProvider] Restarting Astro dev server...');
    
    await this.sandbox.runCode(`
import subprocess
import time
import os

os.chdir('/home/user/app')

# Kill existing Astro process
subprocess.run(['pkill', '-f', 'astro'], capture_output=True)
time.sleep(2)

# Start Astro dev server
env = os.environ.copy()
env['FORCE_COLOR'] = '0'

process = subprocess.Popen(
    ['npm', 'run', 'dev'],
    stdout=subprocess.PIPE,
    stderr=subprocess.PIPE,
    env=env
)

print(f'✓ Astro restarted with PID: {process.pid}')
    `);
    
    // Wait for Astro to be ready
    const astroStartupDelay = 12000;
    await new Promise(resolve => setTimeout(resolve, astroStartupDelay));
  }

  /**
   * Restart the Next.js dev server
   */
  async restartNextServer(): Promise<void> {
    if (!this.sandbox) {
      throw new Error('No active sandbox');
    }

    console.log('[E2BProvider] Restarting Next.js dev server...');
    
    await this.sandbox.runCode(`
import subprocess
import time
import os

os.chdir('/home/user/app')

# Kill existing Next.js process
subprocess.run(['pkill', '-f', 'next'], capture_output=True)
time.sleep(2)

# Start Next.js dev server
env = os.environ.copy()
env['FORCE_COLOR'] = '0'

process = subprocess.Popen(
    ['npm', 'run', 'dev'],
    stdout=subprocess.PIPE,
    stderr=subprocess.PIPE,
    env=env
)

print(f'✓ Next.js restarted with PID: {process.pid}')
    `);
    
    // Wait for Next.js to be ready
    const nextjsStartupDelay = 15000;
    await new Promise(resolve => setTimeout(resolve, nextjsStartupDelay));
  }

  getSandboxUrl(): string | null {
    return this.sandboxInfo?.url || null;
  }

  getSandboxInfo(): SandboxInfo | null {
    return this.sandboxInfo;
  }

  async terminate(): Promise<void> {
    if (this.sandbox) {
      try {
        await this.sandbox.kill();
      } catch (e) {
        console.error('Failed to terminate sandbox:', e);
      }
      this.sandbox = null;
      this.sandboxInfo = null;
    }
  }

  isAlive(): boolean {
    return !!this.sandbox;
  }
}