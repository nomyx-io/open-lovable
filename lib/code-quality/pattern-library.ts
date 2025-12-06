/**
 * Pattern Library
 * 
 * Reusable code patterns and examples that the AI can reference
 * to generate consistent, high-quality code.
 */

export interface CodePattern {
  name: string;
  description: string;
  category: PatternCategory;
  code: string;
  tags: string[];
  useCases: string[];
}

export type PatternCategory = 
  | 'component'
  | 'hook'
  | 'utility'
  | 'layout'
  | 'form'
  | 'data-fetching'
  | 'state-management'
  | 'animation'
  | 'error-handling'
  | 'accessibility';

/**
 * Component Patterns
 */
export const componentPatterns: CodePattern[] = [
  {
    name: 'ResponsiveCard',
    description: 'A responsive card component with hover effects and proper accessibility',
    category: 'component',
    code: `interface CardProps {
  title: string;
  description: string;
  imageUrl?: string;
  imageAlt?: string;
  href?: string;
  onClick?: () => void;
}

export function Card({ title, description, imageUrl, imageAlt, href, onClick }: CardProps) {
  const Wrapper = href ? 'a' : 'div';
  const wrapperProps = href 
    ? { href, className: "block" }
    : onClick 
      ? { role: "button", tabIndex: 0, onClick, onKeyDown: (e: React.KeyboardEvent) => e.key === 'Enter' && onClick() }
      : {};

  return (
    <Wrapper {...wrapperProps} className="group">
      <div className="bg-white rounded-xl shadow-lg overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
        {imageUrl && (
          <div className="aspect-video overflow-hidden">
            <img 
              src={imageUrl} 
              alt={imageAlt || ''} 
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
            />
          </div>
        )}
        <div className="p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
          <p className="text-gray-600">{description}</p>
        </div>
      </div>
    </Wrapper>
  );
}`,
    tags: ['card', 'responsive', 'hover', 'accessible'],
    useCases: ['product cards', 'blog posts', 'feature highlights']
  },
  {
    name: 'Button',
    description: 'A versatile button component with variants, loading state, and accessibility',
    category: 'component',
    code: `interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  children: React.ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  leftIcon,
  rightIcon,
  children,
  disabled,
  className = '',
  ...props
}: ButtonProps) {
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variants = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
    secondary: 'bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500',
    outline: 'border-2 border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-gray-500',
    ghost: 'text-gray-600 hover:bg-gray-100 focus:ring-gray-500',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500'
  };
  
  const sizes = {
    sm: 'px-3 py-1.5 text-sm gap-1.5',
    md: 'px-4 py-2 text-base gap-2',
    lg: 'px-6 py-3 text-lg gap-2.5'
  };

  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={\`\${baseStyles} \${variants[variant]} \${sizes[size]} \${className}\`}
    >
      {loading && (
        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
      {!loading && leftIcon}
      <span>{children}</span>
      {!loading && rightIcon}
    </button>
  );
}`,
    tags: ['button', 'variants', 'loading', 'accessible'],
    useCases: ['forms', 'actions', 'navigation']
  },
  {
    name: 'Modal',
    description: 'Accessible modal/dialog with focus trapping and keyboard navigation',
    category: 'component',
    code: `import { useEffect, useRef, useCallback } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export function Modal({ isOpen, onClose, title, children, size = 'md' }: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  const sizes = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl'
  };

  // Handle escape key
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
  }, [onClose]);

  useEffect(() => {
    if (isOpen) {
      previousActiveElement.current = document.activeElement as HTMLElement;
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
      
      // Focus first focusable element
      const focusable = modalRef.current?.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusable?.length) (focusable[0] as HTMLElement).focus();
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
      previousActiveElement.current?.focus();
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* Modal content */}
      <div 
        ref={modalRef}
        className={\`relative bg-white rounded-xl shadow-2xl w-full \${sizes[size]} max-h-[90vh] overflow-hidden\`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 id="modal-title" className="text-xl font-semibold text-gray-900">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Close modal"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {/* Body */}
        <div className="p-4 overflow-y-auto max-h-[calc(90vh-8rem)]">
          {children}
        </div>
      </div>
    </div>
  );
}`,
    tags: ['modal', 'dialog', 'accessible', 'focus-trap'],
    useCases: ['dialogs', 'confirmations', 'forms', 'detail views']
  }
];

/**
 * Hook Patterns
 */
export const hookPatterns: CodePattern[] = [
  {
    name: 'useLocalStorage',
    description: 'Custom hook for syncing state with localStorage',
    category: 'hook',
    code: `import { useState, useEffect } from 'react';

export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((prev: T) => T)) => void] {
  // Get stored value or use initial
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') return initialValue;
    
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(\`Error reading localStorage key "\${key}":\`, error);
      return initialValue;
    }
  });

  // Update localStorage when value changes
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    try {
      window.localStorage.setItem(key, JSON.stringify(storedValue));
    } catch (error) {
      console.error(\`Error setting localStorage key "\${key}":\`, error);
    }
  }, [key, storedValue]);

  return [storedValue, setStoredValue];
}`,
    tags: ['localStorage', 'state', 'persistence'],
    useCases: ['user preferences', 'form drafts', 'theme settings']
  },
  {
    name: 'useDebounce',
    description: 'Hook to debounce a value, useful for search inputs',
    category: 'hook',
    code: `import { useState, useEffect } from 'react';

export function useDebounce<T>(value: T, delay: number = 500): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Usage example:
// const [searchTerm, setSearchTerm] = useState('');
// const debouncedSearch = useDebounce(searchTerm, 300);
// useEffect(() => { fetchResults(debouncedSearch); }, [debouncedSearch]);`,
    tags: ['debounce', 'performance', 'search'],
    useCases: ['search inputs', 'API calls', 'form validation']
  },
  {
    name: 'useFetch',
    description: 'Generic data fetching hook with loading and error states',
    category: 'data-fetching',
    code: `import { useState, useEffect, useCallback } from 'react';

interface FetchState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

interface UseFetchOptions {
  immediate?: boolean;
  onSuccess?: (data: any) => void;
  onError?: (error: Error) => void;
}

export function useFetch<T>(
  url: string, 
  options: UseFetchOptions = { immediate: true }
): FetchState<T> & { refetch: () => Promise<void> } {
  const [state, setState] = useState<FetchState<T>>({
    data: null,
    loading: options.immediate ?? true,
    error: null
  });

  const fetchData = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(\`HTTP error! status: \${response.status}\`);
      }
      
      const data = await response.json();
      setState({ data, loading: false, error: null });
      options.onSuccess?.(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setState(prev => ({ ...prev, loading: false, error: errorMessage }));
      options.onError?.(err instanceof Error ? err : new Error(errorMessage));
    }
  }, [url]);

  useEffect(() => {
    if (options.immediate) {
      fetchData();
    }
  }, [fetchData, options.immediate]);

  return { ...state, refetch: fetchData };
}`,
    tags: ['fetch', 'api', 'loading', 'error-handling'],
    useCases: ['API calls', 'data loading', 'async operations']
  }
];

/**
 * Layout Patterns
 */
export const layoutPatterns: CodePattern[] = [
  {
    name: 'ResponsiveGrid',
    description: 'A responsive grid layout that adapts to different screen sizes',
    category: 'layout',
    code: `interface GridProps {
  children: React.ReactNode;
  columns?: {
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
  gap?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function Grid({ 
  children, 
  columns = { sm: 1, md: 2, lg: 3, xl: 4 },
  gap = 'md',
  className = '' 
}: GridProps) {
  const gapSizes = {
    sm: 'gap-2',
    md: 'gap-4',
    lg: 'gap-6'
  };

  const colClasses = [
    columns.sm && \`grid-cols-\${columns.sm}\`,
    columns.md && \`md:grid-cols-\${columns.md}\`,
    columns.lg && \`lg:grid-cols-\${columns.lg}\`,
    columns.xl && \`xl:grid-cols-\${columns.xl}\`
  ].filter(Boolean).join(' ');

  return (
    <div className={\`grid \${colClasses} \${gapSizes[gap]} \${className}\`}>
      {children}
    </div>
  );
}`,
    tags: ['grid', 'responsive', 'layout'],
    useCases: ['card grids', 'galleries', 'dashboards']
  },
  {
    name: 'Container',
    description: 'A responsive container with max-width constraints',
    category: 'layout',
    code: `interface ContainerProps {
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  padding?: boolean;
  className?: string;
}

export function Container({ 
  children, 
  size = 'lg',
  padding = true,
  className = '' 
}: ContainerProps) {
  const sizes = {
    sm: 'max-w-2xl',
    md: 'max-w-4xl',
    lg: 'max-w-6xl',
    xl: 'max-w-7xl',
    full: 'max-w-full'
  };

  return (
    <div className={\`mx-auto w-full \${sizes[size]} \${padding ? 'px-4 sm:px-6 lg:px-8' : ''} \${className}\`}>
      {children}
    </div>
  );
}`,
    tags: ['container', 'responsive', 'layout'],
    useCases: ['page layouts', 'content sections']
  }
];

/**
 * Form Patterns
 */
export const formPatterns: CodePattern[] = [
  {
    name: 'Input',
    description: 'Accessible input component with label and error handling',
    category: 'form',
    code: `interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  helperText?: string;
}

export function Input({ 
  label, 
  error, 
  helperText, 
  id,
  className = '',
  ...props 
}: InputProps) {
  const inputId = id || label.toLowerCase().replace(/\\s+/g, '-');
  const helperId = \`\${inputId}-helper\`;
  const errorId = \`\${inputId}-error\`;

  return (
    <div className="space-y-1">
      <label 
        htmlFor={inputId}
        className="block text-sm font-medium text-gray-700"
      >
        {label}
        {props.required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      <input
        {...props}
        id={inputId}
        className={\`
          w-full px-3 py-2 rounded-lg border transition-colors
          focus:outline-none focus:ring-2 focus:ring-offset-1
          \${error 
            ? 'border-red-300 text-red-900 focus:ring-red-500 focus:border-red-500' 
            : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
          }
          disabled:bg-gray-100 disabled:cursor-not-allowed
          \${className}
        \`}
        aria-invalid={!!error}
        aria-describedby={error ? errorId : helperText ? helperId : undefined}
      />
      
      {helperText && !error && (
        <p id={helperId} className="text-sm text-gray-500">
          {helperText}
        </p>
      )}
      
      {error && (
        <p id={errorId} className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}`,
    tags: ['input', 'form', 'accessible', 'validation'],
    useCases: ['forms', 'search fields', 'data entry']
  }
];

/**
 * Error Handling Patterns
 */
export const errorPatterns: CodePattern[] = [
  {
    name: 'ErrorBoundary',
    description: 'React error boundary with fallback UI',
    category: 'error-handling',
    code: `import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-[200px] flex items-center justify-center p-6">
          <div className="text-center">
            <div className="w-12 h-12 mx-auto mb-4 text-red-500">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Something went wrong
            </h3>
            <p className="text-gray-600 mb-4">
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Try again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}`,
    tags: ['error-boundary', 'error-handling', 'recovery'],
    useCases: ['app sections', 'widgets', 'third-party components']
  }
];

/**
 * Get all patterns
 */
export function getAllPatterns(): CodePattern[] {
  return [
    ...componentPatterns,
    ...hookPatterns,
    ...layoutPatterns,
    ...formPatterns,
    ...errorPatterns
  ];
}

/**
 * Get patterns by category
 */
export function getPatternsByCategory(category: PatternCategory): CodePattern[] {
  return getAllPatterns().filter(p => p.category === category);
}

/**
 * Search patterns by tags or name
 */
export function searchPatterns(query: string): CodePattern[] {
  const lowerQuery = query.toLowerCase();
  return getAllPatterns().filter(pattern => 
    pattern.name.toLowerCase().includes(lowerQuery) ||
    pattern.description.toLowerCase().includes(lowerQuery) ||
    pattern.tags.some(tag => tag.toLowerCase().includes(lowerQuery)) ||
    pattern.useCases.some(use => use.toLowerCase().includes(lowerQuery))
  );
}

/**
 * Format patterns for AI prompt context
 */
export function formatPatternsForPrompt(patterns: CodePattern[]): string {
  return patterns.map(pattern => `
### ${pattern.name}
${pattern.description}

\`\`\`typescript
${pattern.code}
\`\`\`

Tags: ${pattern.tags.join(', ')}
Use cases: ${pattern.useCases.join(', ')}
`).join('\n\n---\n\n');
}

export default getAllPatterns;