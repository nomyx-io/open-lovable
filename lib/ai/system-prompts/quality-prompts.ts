/**
 * Quality Enhancement Prompts
 * 
 * Additional instructions for generating higher quality code with
 * TypeScript best practices, accessibility, and performance patterns.
 */

export const typescriptBestPracticesPrompt = `
## TYPESCRIPT BEST PRACTICES

When generating TypeScript or TSX code:

### 1. Type Definitions
- ALWAYS define interfaces for component props
- Use type annotations for function parameters and return types
- Prefer interfaces over type aliases for object shapes
- Export types that may be reused

\`\`\`typescript
// GOOD: Well-typed component
interface ButtonProps {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
  children?: React.ReactNode;
}

export function Button({ label, onClick, variant = 'primary', disabled = false, children }: ButtonProps) {
  return (
    <button 
      onClick={onClick} 
      disabled={disabled}
      className={\`btn btn-\${variant}\`}
    >
      {children || label}
    </button>
  );
}

// BAD: Untyped or using 'any'
function Button({ label, onClick, ...props }: any) { ... }
\`\`\`

### 2. Generic Types
- Use generics for reusable components and functions
- Constrain generics when appropriate

\`\`\`typescript
// Typed list component
interface ListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  keyExtractor: (item: T) => string;
}

function List<T>({ items, renderItem, keyExtractor }: ListProps<T>) {
  return (
    <ul>
      {items.map((item, index) => (
        <li key={keyExtractor(item)}>{renderItem(item, index)}</li>
      ))}
    </ul>
  );
}
\`\`\`

### 3. Strict Null Checks
- Handle null/undefined explicitly
- Use optional chaining and nullish coalescing

\`\`\`typescript
// GOOD: Explicit null handling
const displayName = user?.name ?? 'Anonymous';
const email = user?.email || 'No email provided';

// BAD: Ignoring potential null
const displayName = user.name; // May crash
\`\`\`
`;

export const accessibilityPrompt = `
## ACCESSIBILITY (A11Y) REQUIREMENTS

ALL generated code MUST follow WCAG 2.1 Level AA guidelines:

### 1. Semantic HTML
- Use proper HTML5 elements: <header>, <nav>, <main>, <article>, <section>, <aside>, <footer>
- Use headings in order (h1 -> h2 -> h3, no skipping)
- Use <button> for actions, <a> for navigation

\`\`\`jsx
// GOOD: Semantic structure
<main>
  <header>
    <h1>Page Title</h1>
    <nav aria-label="Main navigation">
      <ul>
        <li><a href="/home">Home</a></li>
        <li><a href="/about">About</a></li>
      </ul>
    </nav>
  </header>
  <article>
    <h2>Article Title</h2>
    <p>Content...</p>
  </article>
</main>

// BAD: Div soup
<div className="header">
  <div className="title">Page Title</div>
  <div className="nav">
    <span onClick={...}>Home</span>
  </div>
</div>
\`\`\`

### 2. ARIA Attributes
- Add aria-label for icon-only buttons
- Use aria-describedby for form field hints
- Use aria-live for dynamic content updates
- Use role attribute when semantic element isn't available

\`\`\`jsx
// Icon button with accessible label
<button aria-label="Close dialog" onClick={onClose}>
  <XIcon className="h-5 w-5" />
</button>

// Form with accessible labels
<div>
  <label htmlFor="email">Email</label>
  <input 
    id="email" 
    type="email" 
    aria-describedby="email-hint"
    aria-invalid={!!errors.email}
  />
  <p id="email-hint" className="text-sm text-gray-500">
    We'll never share your email.
  </p>
</div>

// Live region for updates
<div aria-live="polite" aria-atomic="true">
  {statusMessage}
</div>
\`\`\`

### 3. Keyboard Navigation
- All interactive elements must be keyboard accessible
- Use tabIndex appropriately (0 for focusable, -1 for programmatic focus)
- Implement proper focus management in modals/dialogs

\`\`\`jsx
// Keyboard-accessible card
<article
  tabIndex={0}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      onClick();
    }
  }}
  onClick={onClick}
  role="button"
  aria-pressed={isSelected}
>
  Card content
</article>
\`\`\`

### 4. Color and Contrast
- Never rely on color alone to convey information
- Ensure text has at least 4.5:1 contrast ratio
- Provide visible focus indicators

\`\`\`jsx
// GOOD: Status with icon and text
<div className={getStatusClass(status)}>
  {status === 'error' && <ExclamationIcon />}
  {status === 'success' && <CheckIcon />}
  <span>{statusMessage}</span>
</div>

// Focus indicator
<button className="focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
  Click me
</button>
\`\`\`

### 5. Images and Media
- All images must have alt text
- Decorative images should have alt=""
- Complex images should have detailed descriptions

\`\`\`jsx
// Informative image
<img src="/chart.png" alt="Sales increased 25% in Q4 2023" />

// Decorative image
<img src="/decorative-line.svg" alt="" role="presentation" />
\`\`\`
`;

export const performancePrompt = `
## PERFORMANCE PATTERNS

Follow these patterns for optimal React performance:

### 1. Component Optimization
- Use React.memo for pure components that render often
- Use useCallback for event handlers passed to children
- Use useMemo for expensive computations

\`\`\`jsx
import { memo, useCallback, useMemo } from 'react';

// Memoized child component
const ExpensiveList = memo(function ExpensiveList({ items, onItemClick }) {
  return (
    <ul>
      {items.map(item => (
        <li key={item.id} onClick={() => onItemClick(item.id)}>
          {item.name}
        </li>
      ))}
    </ul>
  );
});

// Parent with optimized callbacks
function Parent({ data }) {
  const [selectedId, setSelectedId] = useState(null);
  
  // Memoized callback
  const handleItemClick = useCallback((id) => {
    setSelectedId(id);
  }, []);
  
  // Memoized computation
  const filteredItems = useMemo(() => {
    return data.filter(item => item.active);
  }, [data]);
  
  return <ExpensiveList items={filteredItems} onItemClick={handleItemClick} />;
}
\`\`\`

### 2. Lazy Loading
- Use React.lazy for code splitting
- Wrap lazy components in Suspense

\`\`\`jsx
import { lazy, Suspense } from 'react';

const HeavyChart = lazy(() => import('./HeavyChart'));

function Dashboard() {
  return (
    <div>
      <h1>Dashboard</h1>
      <Suspense fallback={<div className="animate-pulse h-64 bg-gray-200" />}>
        <HeavyChart />
      </Suspense>
    </div>
  );
}
\`\`\`

### 3. List Virtualization Pattern
- For long lists, implement virtualization or windowing
- Always use stable keys

\`\`\`jsx
// For very long lists, suggest using react-window or @tanstack/virtual
// Minimum: always use unique, stable keys
{items.map(item => (
  <Item 
    key={item.id} // NEVER use index as key for dynamic lists
    data={item}
  />
))}
\`\`\`

### 4. State Management
- Keep state as close to where it's used as possible
- Avoid lifting state unnecessarily
- Use state colocation

\`\`\`jsx
// GOOD: Local state for local concerns
function SearchBar() {
  const [query, setQuery] = useState('');
  // ...
}

// GOOD: Lifted state when shared
function ProductPage() {
  const [selectedProduct, setSelectedProduct] = useState(null);
  return (
    <>
      <ProductList onSelect={setSelectedProduct} />
      <ProductDetails product={selectedProduct} />
    </>
  );
}
\`\`\`

### 5. Image Optimization
- Use proper image formats (WebP, AVIF where supported)
- Include width and height to prevent layout shift
- Use lazy loading for below-fold images

\`\`\`jsx
<img 
  src="/hero.webp"
  alt="Hero image"
  width={1200}
  height={600}
  loading="lazy"
  decoding="async"
/>
\`\`\`
`;

export const errorHandlingPrompt = `
## ERROR HANDLING PATTERNS

All generated code should include proper error handling:

### 1. React Error Boundaries
- Wrap major sections in error boundaries
- Provide meaningful fallback UI

\`\`\`jsx
// Error boundary component (class component required)
class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };
  
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  
  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }
  
  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <h2 className="text-red-800 font-semibold">Something went wrong</h2>
          <p className="text-red-600 text-sm mt-1">
            {this.state.error?.message || 'An unexpected error occurred'}
          </p>
          <button 
            onClick={() => this.setState({ hasError: false, error: null })}
            className="mt-2 text-sm text-red-700 underline"
          >
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
\`\`\`

### 2. Async/Await Error Handling
- Always wrap async operations in try/catch
- Provide user-friendly error messages

\`\`\`jsx
function DataFetcher() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch('/api/data');
        
        if (!response.ok) {
          throw new Error(\`HTTP error! status: \${response.status}\`);
        }
        
        const json = await response.json();
        setData(json);
      } catch (err) {
        setError(err.message || 'Failed to fetch data');
        console.error('Fetch error:', err);
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
  }, []);
  
  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;
  if (!data) return <EmptyState />;
  
  return <DataDisplay data={data} />;
}
\`\`\`

### 3. Form Validation
- Validate on blur and submit
- Show inline errors near fields
- Prevent submission of invalid forms

\`\`\`jsx
function ContactForm() {
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  
  const validate = (values) => {
    const newErrors = {};
    if (!values.email) {
      newErrors.email = 'Email is required';
    } else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(values.email)) {
      newErrors.email = 'Invalid email address';
    }
    return newErrors;
  };
  
  const handleBlur = (field) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  };
  
  return (
    <form>
      <div>
        <input 
          type="email"
          onBlur={() => handleBlur('email')}
          className={touched.email && errors.email ? 'border-red-500' : ''}
          aria-invalid={!!(touched.email && errors.email)}
          aria-describedby={errors.email ? 'email-error' : undefined}
        />
        {touched.email && errors.email && (
          <p id="email-error" className="text-red-600 text-sm" role="alert">
            {errors.email}
          </p>
        )}
      </div>
    </form>
  );
}
\`\`\`
`;

export const loadingStatesPrompt = `
## LOADING AND EMPTY STATES

Always implement proper loading and empty states:

### 1. Loading States
- Show loading indicators during async operations
- Use skeleton loaders for better perceived performance
- Consider optimistic UI updates

\`\`\`jsx
// Skeleton loader
function CardSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-48 bg-gray-200 rounded-t-lg" />
      <div className="p-4 space-y-3">
        <div className="h-4 bg-gray-200 rounded w-3/4" />
        <div className="h-4 bg-gray-200 rounded w-1/2" />
      </div>
    </div>
  );
}

// Loading wrapper
function AsyncContent({ loading, error, data, children }) {
  if (loading) return <CardSkeleton />;
  if (error) return <ErrorDisplay error={error} />;
  if (!data) return <EmptyState />;
  return children;
}
\`\`\`

### 2. Empty States
- Provide helpful empty states with calls to action
- Explain what the user can do next

\`\`\`jsx
function EmptyProjectsList({ onCreateProject }) {
  return (
    <div className="text-center py-12">
      <FolderIcon className="mx-auto h-12 w-12 text-gray-400" />
      <h3 className="mt-2 text-sm font-semibold text-gray-900">No projects</h3>
      <p className="mt-1 text-sm text-gray-500">
        Get started by creating a new project.
      </p>
      <div className="mt-6">
        <button
          onClick={onCreateProject}
          className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
        >
          <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
          New Project
        </button>
      </div>
    </div>
  );
}
\`\`\`

### 3. Button Loading States
- Disable buttons during async actions
- Show loading indicator
- Prevent double submissions

\`\`\`jsx
function SubmitButton({ loading, children, ...props }) {
  return (
    <button
      {...props}
      disabled={loading || props.disabled}
      className={\`
        relative inline-flex items-center justify-center
        \${loading ? 'opacity-75 cursor-not-allowed' : ''}
      \`}
    >
      {loading && (
        <svg 
          className="animate-spin -ml-1 mr-2 h-4 w-4" 
          fill="none" 
          viewBox="0 0 24 24"
        >
          <circle 
            className="opacity-25" 
            cx="12" cy="12" r="10" 
            stroke="currentColor" 
            strokeWidth="4" 
          />
          <path 
            className="opacity-75" 
            fill="currentColor" 
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" 
          />
        </svg>
      )}
      {children}
    </button>
  );
}
\`\`\`
`;

/**
 * Combine all quality prompts for a given context
 */
export function buildQualityPrompts(options: {
  includeTypeScript?: boolean;
  includeAccessibility?: boolean;
  includePerformance?: boolean;
  includeErrorHandling?: boolean;
  includeLoadingStates?: boolean;
}): string {
  const parts: string[] = [];
  
  if (options.includeTypeScript) {
    parts.push(typescriptBestPracticesPrompt);
  }
  
  if (options.includeAccessibility) {
    parts.push(accessibilityPrompt);
  }
  
  if (options.includePerformance) {
    parts.push(performancePrompt);
  }
  
  if (options.includeErrorHandling) {
    parts.push(errorHandlingPrompt);
  }
  
  if (options.includeLoadingStates) {
    parts.push(loadingStatesPrompt);
  }
  
  return parts.join('\n\n');
}

export default buildQualityPrompts;