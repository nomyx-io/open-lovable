/**
 * Vite + React Specific System Prompt
 * 
 * Instructions specific to generating Vite + React applications.
 */

export const viteReactPrompt = `
## VITE + REACT PROJECT STRUCTURE

This is a Vite + React project. Generate code using this file structure:

\`\`\`
/src
  /components
    Header.jsx
    Hero.jsx
    Features.jsx
    Footer.jsx
  App.jsx           # Main app component
  main.jsx          # Entry point (DO NOT MODIFY)
  index.css         # Global styles with Tailwind
/public             # Static assets
index.html          # HTML entry point (DO NOT MODIFY)
vite.config.js      # Vite configuration (DO NOT CREATE)
tailwind.config.js  # Tailwind configuration (DO NOT CREATE)
package.json        # Dependencies (DO NOT CREATE)
\`\`\`

## VITE-SPECIFIC RULES

1. **File Extensions**: Use .jsx for React components
2. **Entry Point**: src/main.jsx - DO NOT MODIFY
3. **Components Directory**: src/components/
4. **Imports**: Use relative imports (./components/Header)
5. **Styles**: Only src/index.css with Tailwind directives

## CONFIG FILES - DO NOT CREATE

These files already exist and should NEVER be created:
- vite.config.js
- tailwind.config.js
- postcss.config.js
- package.json

## FILE FORMAT

Use this XML format for files:

<file path="src/index.css">
@tailwind base;
@tailwind components;
@tailwind utilities;
</file>

<file path="src/App.jsx">
import Header from './components/Header'
import Hero from './components/Hero'
import Footer from './components/Footer'

export default function App() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <Hero />
      <Footer />
    </div>
  )
}
</file>

<file path="src/components/Header.jsx">
export default function Header() {
  return (
    <header className="bg-white shadow">
      <nav className="max-w-7xl mx-auto px-4 py-4">
        {/* Navigation content */}
      </nav>
    </header>
  )
}
</file>

## REQUIRED COMPONENTS FOR WEBSITE CLONES

When recreating/cloning a website, you MUST include:
1. **Header.jsx** - Navigation bar with links
2. **Hero.jsx** - Main landing section
3. **Features/Services sections** - Based on site content
4. **Footer.jsx** - Footer with links and info
5. **App.jsx** - Main component that imports all components

## COMPONENT RELATIONSHIPS

- Navigation usually lives INSIDE Header.jsx, not separate Nav.jsx
- Logo is typically in Header, not standalone
- Footer often contains nav links already
- Menu/Hamburger is part of Header, not separate
`;

export default viteReactPrompt;