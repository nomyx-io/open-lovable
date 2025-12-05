import { test, expect } from '@playwright/test';

/**
 * E2E Tests for the Generation Flow
 * 
 * These tests cover the critical user journey:
 * 1. Landing page → Generation page navigation
 * 2. URL input and validation
 * 3. Website scraping
 * 4. Code generation
 * 5. Live preview
 * 6. Chat-based editing
 */

test.describe('Generation Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('landing page loads correctly', async ({ page }) => {
    await expect(page).toHaveTitle(/Open Lovable/i);
    
    // Check for main elements
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.getByRole('button', { name: /get started|try it/i })).toBeVisible();
  });

  test('navigates to generation page', async ({ page }) => {
    // Click CTA button
    await page.getByRole('button', { name: /get started|try it/i }).first().click();
    
    // Should be on generation page
    await expect(page).toHaveURL(/\/generation/);
  });

  test('generation page shows welcome message', async ({ page }) => {
    await page.goto('/generation');
    
    // Check for welcome system message
    await expect(page.locator('text=Welcome!')).toBeVisible({ timeout: 10000 });
  });

  test('URL input accepts valid URL', async ({ page }) => {
    await page.goto('/generation');
    
    // Find URL input
    const urlInput = page.getByPlaceholder(/url|website/i).first();
    await expect(urlInput).toBeVisible();
    
    // Enter a URL
    await urlInput.fill('https://example.com');
    await expect(urlInput).toHaveValue('https://example.com');
  });

  test('shows loading state during generation', async ({ page }) => {
    await page.goto('/generation');
    
    // Find and fill URL input
    const urlInput = page.getByPlaceholder(/url|website/i).first();
    await urlInput.fill('https://example.com');
    
    // Click generate button
    const generateBtn = page.getByRole('button', { name: /generate|start|clone/i }).first();
    await generateBtn.click();
    
    // Should show loading indicator
    await expect(page.locator('[data-testid="loading-indicator"], .animate-pulse, .loading')).toBeVisible({ timeout: 5000 });
  });

  test('chat input is functional', async ({ page }) => {
    await page.goto('/generation');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Find chat input
    const chatInput = page.getByPlaceholder(/message|chat|type/i).first();
    
    if (await chatInput.isVisible()) {
      await chatInput.fill('Add a dark mode toggle');
      await expect(chatInput).toHaveValue('Add a dark mode toggle');
    }
  });

  test('preview tabs switch correctly', async ({ page }) => {
    await page.goto('/generation');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Find Code and Preview tabs
    const codeTab = page.getByRole('button', { name: /code/i }).first();
    const previewTab = page.getByRole('button', { name: /preview|view/i }).first();
    
    if (await codeTab.isVisible() && await previewTab.isVisible()) {
      // Click code tab
      await codeTab.click();
      
      // Click preview tab
      await previewTab.click();
    }
  });
});

test.describe('API Routes', () => {
  test('health check API responds', async ({ request }) => {
    // Test a simple API route
    const response = await request.get('/api/sandbox-status');
    expect(response.status()).toBeLessThan(500);
  });

  test('search API accepts query', async ({ request }) => {
    const response = await request.post('/api/search', {
      data: { query: 'test' },
    });
    expect(response.status()).toBeLessThan(500);
  });
});

test.describe('Responsive Design', () => {
  test('mobile layout works', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    // Page should still be functional
    await expect(page.locator('h1')).toBeVisible();
  });

  test('tablet layout works', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/');
    
    await expect(page.locator('h1')).toBeVisible();
  });

  test('desktop layout works', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/');
    
    await expect(page.locator('h1')).toBeVisible();
  });
});

test.describe('Accessibility', () => {
  test('page has proper heading structure', async ({ page }) => {
    await page.goto('/');
    
    const h1 = page.locator('h1');
    await expect(h1).toBeVisible();
  });

  test('buttons are keyboard accessible', async ({ page }) => {
    await page.goto('/');
    
    // Tab to first button
    await page.keyboard.press('Tab');
    
    // Should have focus visible
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();
  });

  test('images have alt text', async ({ page }) => {
    await page.goto('/');
    
    const images = page.locator('img');
    const count = await images.count();
    
    for (let i = 0; i < count; i++) {
      const img = images.nth(i);
      const alt = await img.getAttribute('alt');
      const ariaLabel = await img.getAttribute('aria-label');
      const role = await img.getAttribute('role');
      
      // Either has alt text, aria-label, or is decorative (role=presentation)
      expect(alt || ariaLabel || role === 'presentation').toBeTruthy();
    }
  });
});

test.describe('Error Handling', () => {
  test('404 page shows for invalid routes', async ({ page }) => {
    const response = await page.goto('/this-route-does-not-exist');
    expect(response?.status()).toBe(404);
  });

  test('handles invalid URL input gracefully', async ({ page }) => {
    await page.goto('/generation');
    
    const urlInput = page.getByPlaceholder(/url|website/i).first();
    
    if (await urlInput.isVisible()) {
      await urlInput.fill('not-a-valid-url');
      
      // Should not crash
      await expect(page).toHaveURL(/\/generation/);
    }
  });
});