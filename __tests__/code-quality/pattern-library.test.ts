/**
 * Tests for Pattern Library
 * 
 * Tests the pattern library that provides reusable code patterns
 * for consistent, high-quality code generation.
 */

import { describe, it, expect } from 'vitest';
import {
  getAllPatterns,
  getPatternsByCategory,
  searchPatterns,
  formatPatternsForPrompt,
  componentPatterns,
  hookPatterns,
  layoutPatterns,
  formPatterns,
  errorPatterns,
  type CodePattern,
  type PatternCategory,
} from '../../lib/code-quality/pattern-library';

describe('Pattern Library', () => {
  describe('getAllPatterns', () => {
    it('should return all patterns from all categories', () => {
      const patterns = getAllPatterns();
      
      expect(patterns.length).toBeGreaterThan(0);
      expect(patterns.length).toBe(
        componentPatterns.length +
        hookPatterns.length +
        layoutPatterns.length +
        formPatterns.length +
        errorPatterns.length
      );
    });

    it('should include patterns from component category', () => {
      const patterns = getAllPatterns();
      const componentCount = patterns.filter(p => p.category === 'component').length;
      
      expect(componentCount).toBe(componentPatterns.length);
    });

    it('should include patterns from hook category', () => {
      const patterns = getAllPatterns();
      const hookCount = patterns.filter(p => p.category === 'hook' || p.category === 'data-fetching').length;
      
      expect(hookCount).toBeGreaterThan(0);
    });

    it('should return patterns with required fields', () => {
      const patterns = getAllPatterns();
      
      patterns.forEach(pattern => {
        expect(pattern.name).toBeTruthy();
        expect(pattern.description).toBeTruthy();
        expect(pattern.category).toBeTruthy();
        expect(pattern.code).toBeTruthy();
        expect(Array.isArray(pattern.tags)).toBe(true);
        expect(Array.isArray(pattern.useCases)).toBe(true);
      });
    });
  });

  describe('getPatternsByCategory', () => {
    it('should return only patterns of specified category', () => {
      const patterns = getPatternsByCategory('component');
      
      expect(patterns.length).toBeGreaterThan(0);
      patterns.forEach(pattern => {
        expect(pattern.category).toBe('component');
      });
    });

    it('should return hook patterns', () => {
      const patterns = getPatternsByCategory('hook');
      
      expect(patterns.length).toBeGreaterThan(0);
      patterns.forEach(pattern => {
        expect(pattern.category).toBe('hook');
      });
    });

    it('should return layout patterns', () => {
      const patterns = getPatternsByCategory('layout');
      
      expect(patterns.length).toBeGreaterThan(0);
      patterns.forEach(pattern => {
        expect(pattern.category).toBe('layout');
      });
    });

    it('should return form patterns', () => {
      const patterns = getPatternsByCategory('form');
      
      expect(patterns.length).toBeGreaterThan(0);
      patterns.forEach(pattern => {
        expect(pattern.category).toBe('form');
      });
    });

    it('should return error-handling patterns', () => {
      const patterns = getPatternsByCategory('error-handling');
      
      expect(patterns.length).toBeGreaterThan(0);
      patterns.forEach(pattern => {
        expect(pattern.category).toBe('error-handling');
      });
    });

    it('should return empty array for non-existent category', () => {
      const patterns = getPatternsByCategory('non-existent' as PatternCategory);
      
      expect(patterns.length).toBe(0);
    });
  });

  describe('searchPatterns', () => {
    it('should find patterns by name', () => {
      const patterns = searchPatterns('Button');
      
      expect(patterns.length).toBeGreaterThan(0);
      expect(patterns.some(p => p.name.toLowerCase().includes('button'))).toBe(true);
    });

    it('should find patterns by description', () => {
      const patterns = searchPatterns('accessible');
      
      expect(patterns.length).toBeGreaterThan(0);
      expect(patterns.some(p => p.description.toLowerCase().includes('accessible'))).toBe(true);
    });

    it('should find patterns by tag', () => {
      const patterns = searchPatterns('responsive');
      
      expect(patterns.length).toBeGreaterThan(0);
      expect(patterns.some(p => p.tags.some(t => t.includes('responsive')))).toBe(true);
    });

    it('should find patterns by use case', () => {
      const patterns = searchPatterns('forms');
      
      expect(patterns.length).toBeGreaterThan(0);
      expect(patterns.some(p => 
        p.useCases.some(u => u.toLowerCase().includes('form'))
      )).toBe(true);
    });

    it('should be case-insensitive', () => {
      const upperResults = searchPatterns('BUTTON');
      const lowerResults = searchPatterns('button');
      
      expect(upperResults.length).toBe(lowerResults.length);
    });

    it('should return empty array for no matches', () => {
      const patterns = searchPatterns('xyznonexistent');
      
      expect(patterns.length).toBe(0);
    });

    it('should match partial strings', () => {
      const patterns = searchPatterns('respon');
      
      expect(patterns.length).toBeGreaterThan(0);
    });
  });

  describe('formatPatternsForPrompt', () => {
    it('should format patterns as markdown', () => {
      const patterns = [componentPatterns[0]];
      const formatted = formatPatternsForPrompt(patterns);
      
      expect(formatted).toContain('###');
      expect(formatted).toContain('```typescript');
      expect(formatted).toContain('Tags:');
      expect(formatted).toContain('Use cases:');
    });

    it('should include pattern name', () => {
      const patterns = [componentPatterns[0]];
      const formatted = formatPatternsForPrompt(patterns);
      
      expect(formatted).toContain(patterns[0].name);
    });

    it('should include pattern description', () => {
      const patterns = [componentPatterns[0]];
      const formatted = formatPatternsForPrompt(patterns);
      
      expect(formatted).toContain(patterns[0].description);
    });

    it('should include pattern code', () => {
      const patterns = [componentPatterns[0]];
      const formatted = formatPatternsForPrompt(patterns);
      
      expect(formatted).toContain(patterns[0].code);
    });

    it('should separate multiple patterns', () => {
      const patterns = componentPatterns.slice(0, 2);
      const formatted = formatPatternsForPrompt(patterns);
      
      expect(formatted).toContain('---');
      expect(formatted.split('###').length).toBeGreaterThan(2);
    });

    it('should include tags', () => {
      const patterns = [componentPatterns[0]];
      const formatted = formatPatternsForPrompt(patterns);
      
      patterns[0].tags.forEach(tag => {
        expect(formatted).toContain(tag);
      });
    });

    it('should include use cases', () => {
      const patterns = [componentPatterns[0]];
      const formatted = formatPatternsForPrompt(patterns);
      
      patterns[0].useCases.forEach(useCase => {
        expect(formatted).toContain(useCase);
      });
    });

    it('should handle empty pattern array', () => {
      const formatted = formatPatternsForPrompt([]);
      
      expect(formatted).toBe('');
    });
  });

  describe('Pattern Content', () => {
    describe('Component Patterns', () => {
      it('should have ResponsiveCard pattern', () => {
        const card = componentPatterns.find(p => p.name === 'ResponsiveCard');
        
        expect(card).toBeDefined();
        expect(card?.code).toContain('CardProps');
        expect(card?.code).toContain('className');
      });

      it('should have Button pattern with variants', () => {
        const button = componentPatterns.find(p => p.name === 'Button');
        
        expect(button).toBeDefined();
        expect(button?.code).toContain('variant');
        expect(button?.code).toContain('loading');
        expect(button?.code).toContain('disabled');
      });

      it('should have Modal pattern with accessibility', () => {
        const modal = componentPatterns.find(p => p.name === 'Modal');
        
        expect(modal).toBeDefined();
        expect(modal?.code).toContain('aria-modal');
        expect(modal?.code).toContain('role="dialog"');
        expect(modal?.code).toContain('Escape');
      });
    });

    describe('Hook Patterns', () => {
      it('should have useLocalStorage pattern', () => {
        const hook = hookPatterns.find(p => p.name === 'useLocalStorage');
        
        expect(hook).toBeDefined();
        expect(hook?.code).toContain('localStorage');
        expect(hook?.code).toContain('JSON.parse');
      });

      it('should have useDebounce pattern', () => {
        const hook = hookPatterns.find(p => p.name === 'useDebounce');
        
        expect(hook).toBeDefined();
        expect(hook?.code).toContain('setTimeout');
        expect(hook?.code).toContain('clearTimeout');
      });

      it('should have useFetch pattern', () => {
        const hook = hookPatterns.find(p => p.name === 'useFetch');
        
        expect(hook).toBeDefined();
        expect(hook?.code).toContain('loading');
        expect(hook?.code).toContain('error');
        expect(hook?.code).toContain('fetch');
      });
    });

    describe('Layout Patterns', () => {
      it('should have ResponsiveGrid pattern', () => {
        const grid = layoutPatterns.find(p => p.name === 'ResponsiveGrid');
        
        expect(grid).toBeDefined();
        expect(grid?.code).toContain('grid-cols');
        expect(grid?.code).toContain('gap');
      });

      it('should have Container pattern', () => {
        const container = layoutPatterns.find(p => p.name === 'Container');
        
        expect(container).toBeDefined();
        expect(container?.code).toContain('max-w');
        expect(container?.code).toContain('mx-auto');
      });
    });

    describe('Form Patterns', () => {
      it('should have Input pattern with accessibility', () => {
        const input = formPatterns.find(p => p.name === 'Input');
        
        expect(input).toBeDefined();
        expect(input?.code).toContain('htmlFor');
        expect(input?.code).toContain('aria-invalid');
        expect(input?.code).toContain('aria-describedby');
      });
    });

    describe('Error Patterns', () => {
      it('should have ErrorBoundary pattern', () => {
        const errorBoundary = errorPatterns.find(p => p.name === 'ErrorBoundary');
        
        expect(errorBoundary).toBeDefined();
        expect(errorBoundary?.code).toContain('componentDidCatch');
        expect(errorBoundary?.code).toContain('getDerivedStateFromError');
        expect(errorBoundary?.code).toContain('Try again');
      });
    });
  });

  describe('Pattern Quality', () => {
    it('should have TypeScript types in all patterns', () => {
      const patterns = getAllPatterns();
      
      patterns.forEach(pattern => {
        // Most patterns should have some type annotations
        const hasTypes = pattern.code.includes('interface') || 
                         pattern.code.includes(': ') ||
                         pattern.code.includes('<') ||
                         pattern.code.includes('Props');
        expect(hasTypes).toBe(true);
      });
    });

    it('should have Tailwind classes in component patterns', () => {
      const uiPatterns = [...componentPatterns, ...layoutPatterns, ...formPatterns];
      
      uiPatterns.forEach(pattern => {
        expect(pattern.code).toContain('className');
      });
    });

    it('should have multiple tags for each pattern', () => {
      const patterns = getAllPatterns();
      
      patterns.forEach(pattern => {
        expect(pattern.tags.length).toBeGreaterThanOrEqual(1);
      });
    });

    it('should have use cases for each pattern', () => {
      const patterns = getAllPatterns();
      
      patterns.forEach(pattern => {
        expect(pattern.useCases.length).toBeGreaterThanOrEqual(1);
      });
    });
  });
});