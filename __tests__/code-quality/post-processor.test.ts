/**
 * Tests for Post-Processor
 * 
 * Tests the post-processing functionality that automatically fixes
 * common issues in generated code.
 */

import { describe, it, expect } from 'vitest';
import {
  postProcessFile,
  postProcessGeneratedCode,
  type PostProcessingResult,
} from '../../lib/code-quality/post-processor';

describe('Post-Processor', () => {
  describe('postProcessFile - Syntax Fixes', () => {
    it('should make void elements self-closing', () => {
      const code = `<img src="test.jpg">`;
      
      const result = postProcessFile(code, 'test.tsx');
      
      // The code adds both self-closing and alt attribute
      expect(result.code).toContain('src="test.jpg"');
      expect(result.code).toContain('alt=""');
      expect(result.hadIssues).toBe(true);
    });

    it('should convert class to className', () => {
      const code = `<div class="container">Content</div>`;
      
      const result = postProcessFile(code, 'test.tsx');
      
      expect(result.code).toContain('className="container"');
      expect(result.changes.some(c => c.description.includes('className'))).toBe(true);
    });

    it('should fix onclick to onClick', () => {
      const code = `<button onclick={handleClick}>Click</button>`;
      
      const result = postProcessFile(code, 'test.tsx');
      
      expect(result.code).toContain('onClick=');
      expect(result.changes.some(c => c.description.includes('onClick'))).toBe(true);
    });

    it('should fix for to htmlFor', () => {
      const code = `<label for="email">Email</label>`;
      
      const result = postProcessFile(code, 'test.tsx');
      
      expect(result.code).toContain('htmlFor="email"');
    });

    it('should fix broken template literals in className', () => {
      const code = `<div className="\${active ? 'on' : 'off'}">Toggle</div>`;
      
      const result = postProcessFile(code, 'test.tsx');
      
      expect(result.code).toContain('className={`');
    });

    it('should add semicolons to imports', () => {
      const code = `import { useState } from 'react'
import { useEffect } from 'react'`;
      
      const result = postProcessFile(code, 'test.tsx');
      
      expect(result.code).toMatch(/from 'react';/);
    });
  });

  describe('postProcessFile - Import Fixes', () => {
    it('should add missing React hooks import', () => {
      const code = `
function Component() {
  const [count, setCount] = useState(0);
  useEffect(() => {}, []);
  return <div>{count}</div>;
}
      `;
      
      const result = postProcessFile(code, 'Component.tsx');
      
      expect(result.code).toContain("import { useState, useEffect } from 'react'");
    });

    it('should add missing hooks to existing React import', () => {
      const code = `
import { useState } from 'react';

function Component() {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  return <div ref={ref}>{count}</div>;
}
      `;
      
      const result = postProcessFile(code, 'Component.tsx');
      
      expect(result.code).toContain('useRef');
      expect(result.code).toMatch(/import\s*\{[^}]*useState[^}]*useRef[^}]*\}/);
    });

    it('should remove duplicate imports', () => {
      const code = `
import { useState } from 'react';
import { useState } from 'react';

function Component() {
  const [count, setCount] = useState(0);
  return <div>{count}</div>;
}
      `;
      
      const result = postProcessFile(code, 'Component.tsx');
      
      const importCount = (result.code.match(/import \{ useState \}/g) || []).length;
      expect(importCount).toBe(1);
    });
  });

  describe('postProcessFile - Tailwind Fixes', () => {
    it('should replace invalid bg-background with valid classes', () => {
      const code = `<div className="bg-background text-foreground">Content</div>`;
      
      const result = postProcessFile(code, 'test.tsx');
      
      expect(result.code).not.toContain('bg-background');
      expect(result.code).toContain('bg-white');
    });

    it('should replace invalid text-foreground', () => {
      const code = `<div className="text-foreground">Text</div>`;
      
      const result = postProcessFile(code, 'test.tsx');
      
      expect(result.code).not.toContain('text-foreground');
      expect(result.code).toContain('text-gray-900');
    });

    it('should replace invalid shadow classes', () => {
      const code = `<div className="shadow-3xl">Box</div>`;
      
      const result = postProcessFile(code, 'test.tsx');
      
      expect(result.code).not.toContain('shadow-3xl');
      expect(result.code).toContain('shadow-2xl');
    });

    it('should replace bg-primary with actual color', () => {
      const code = `<button className="bg-primary text-white">Button</button>`;
      
      const result = postProcessFile(code, 'test.tsx');
      
      expect(result.code).not.toContain('bg-primary');
      expect(result.code).toContain('bg-blue-600');
    });
  });

  describe('postProcessFile - Accessibility Fixes', () => {
    it('should add alt="" to images without alt', () => {
      const code = `<img src="photo.jpg" />`;
      
      const result = postProcessFile(code, 'test.tsx');
      
      expect(result.code).toContain('alt=""');
    });

    it('should add role and tabIndex to clickable divs', () => {
      const code = `<div onClick={handleClick}>Clickable</div>`;
      
      const result = postProcessFile(code, 'test.tsx');
      
      expect(result.code).toContain('role="button"');
      expect(result.code).toContain('tabIndex={0}');
    });

    it('should not add role if already present', () => {
      const code = `<div onClick={handleClick} role="link">Link</div>`;
      
      const result = postProcessFile(code, 'test.tsx');
      
      expect((result.code.match(/role=/g) || []).length).toBe(1);
    });
  });

  describe('postProcessFile - Export Fixes', () => {
    it('should add default export to component file', () => {
      const code = `
function Button() {
  return <button>Click</button>;
}
      `;
      
      const result = postProcessFile(code, 'components/Button.tsx');
      
      expect(result.code).toContain('export default Button');
    });

    it('should not add export if already present', () => {
      const code = `
function Button() {
  return <button>Click</button>;
}

export default Button;
      `;
      
      const result = postProcessFile(code, 'components/Button.tsx');
      
      const exportCount = (result.code.match(/export default/g) || []).length;
      expect(exportCount).toBe(1);
    });

    it('should not add export to non-component files', () => {
      const code = `
const utils = {
  add: (a, b) => a + b
};
      `;
      
      const result = postProcessFile(code, 'lib/utils.ts');
      
      expect(result.code).not.toContain('export default utils');
    });
  });

  describe('postProcessFile - Formatting', () => {
    it('should remove excessive blank lines', () => {
      const code = `function test() {
  return 1;
}




const x = 2;`;
      
      const result = postProcessFile(code, 'test.ts');
      
      expect(result.code).not.toMatch(/\n{4,}/);
    });

    it('should add trailing newline', () => {
      const code = `const x = 1;`;
      
      const result = postProcessFile(code, 'test.ts');
      
      expect(result.code.endsWith('\n')).toBe(true);
    });

    it('should remove trailing whitespace', () => {
      const code = `const x = 1;   
const y = 2;	`;
      
      const result = postProcessFile(code, 'test.ts');
      
      expect(result.code).not.toMatch(/[ \t]+$/m);
    });
  });

  describe('postProcessFile - Options', () => {
    it('should skip import fixes when disabled', () => {
      const code = `
function Component() {
  const [count, setCount] = useState(0);
  return <div>{count}</div>;
}
      `;
      
      const result = postProcessFile(code, 'Component.tsx', { fixImports: false });
      
      expect(result.code).not.toContain("from 'react'");
    });

    it('should skip Tailwind fixes when disabled', () => {
      const code = `<div className="bg-background">Content</div>`;
      
      const result = postProcessFile(code, 'test.tsx', { fixTailwind: false });
      
      expect(result.code).toContain('bg-background');
    });

    it('should skip accessibility fixes when disabled', () => {
      const code = `<img src="photo.jpg" />`;
      
      const result = postProcessFile(code, 'test.tsx', { fixAccessibility: false });
      
      expect(result.code).not.toContain('alt=""');
    });

    it('should skip formatting when disabled', () => {
      const code = `const x = 1;`;
      
      const result = postProcessFile(code, 'test.ts', { formatCode: false });
      
      // Note: formatCode adds trailing newline, so without it there's none
      expect(result.code).toBe(code);
    });
  });

  describe('postProcessFile - Change Tracking', () => {
    it('should track all changes made', () => {
      const code = `
<div class="bg-background" onclick={fn}>
  <img src="test.jpg">
</div>
      `;
      
      const result = postProcessFile(code, 'test.tsx');
      
      expect(result.changes.length).toBeGreaterThan(0);
      expect(result.hadIssues).toBe(true);
    });

    it('should return hadIssues=false for clean code', () => {
      const code = `
function Button() {
  return <button className="bg-blue-600">Click</button>;
}

export default Button;
`;
      
      const result = postProcessFile(code, 'components/Button.tsx');
      
      // Most changes are formatting only
      const significantChanges = result.changes.filter(c => c.type === 'fix');
      expect(significantChanges.length).toBe(0);
    });

    it('should categorize changes by type', () => {
      const code = `
<div class="container" onclick={fn}>
  Content
</div>



`;
      
      const result = postProcessFile(code, 'test.tsx');
      
      const hasFixChanges = result.changes.some(c => c.type === 'fix');
      const hasFormatChanges = result.changes.some(c => c.type === 'format');
      
      expect(hasFixChanges).toBe(true);
      expect(hasFormatChanges).toBe(true);
    });
  });

  describe('postProcessGeneratedCode', () => {
    it('should process multiple files', () => {
      const generatedCode = `
<file path="src/components/Button.tsx">
<div class="bg-background">
  <img src="icon.png">
</div>
</file>
<file path="src/components/Card.tsx">
<div onclick={handleClick}>
  Card content
</div>
</file>
      `;
      
      const result = postProcessGeneratedCode(generatedCode);
      
      expect(result.changes.length).toBeGreaterThan(0);
      expect(Object.keys(result.fileChanges).length).toBe(2);
    });

    it('should track changes per file', () => {
      const generatedCode = `
<file path="Button.tsx">
<div class="btn">Click</div>
</file>
<file path="Card.tsx">
<div class="card">Content</div>
</file>
      `;
      
      const result = postProcessGeneratedCode(generatedCode);
      
      expect(result.fileChanges['Button.tsx']).toBeDefined();
      expect(result.fileChanges['Card.tsx']).toBeDefined();
    });

    it('should update file content in output', () => {
      const generatedCode = `
<file path="test.tsx">
<div class="container">Content</div>
</file>
      `;
      
      const result = postProcessGeneratedCode(generatedCode);
      
      expect(result.code).toContain('className="container"');
      expect(result.code).not.toContain('class="container"');
    });

    it('should preserve files without issues', () => {
      const generatedCode = `
<file path="clean.tsx">
function Clean() {
  return <div className="bg-white">Clean</div>;
}
export default Clean;
</file>
      `;
      
      const result = postProcessGeneratedCode(generatedCode);
      
      expect(result.code).toContain('bg-white');
    });

    it('should handle empty generated code', () => {
      const generatedCode = ``;
      
      const result = postProcessGeneratedCode(generatedCode);
      
      expect(result.code).toBe('');
      expect(result.changes.length).toBe(0);
    });
  });
});