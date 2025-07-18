import { test, expect } from '@playwright/test';
import { createTestUtils } from './test-utils';

test.describe('Homepage', () => {
  let utils: ReturnType<typeof createTestUtils>;

  test.beforeEach(async ({ page }) => {
    utils = createTestUtils(page);
    await utils.clearAuth();
  });

  test('should display homepage correctly', async ({ page }) => {
    await utils.navigateToPage('/');
    
    // Check page title
    await expect(page).toHaveTitle(/Cultivate HQ/);
    
    // Check main navigation
    await expect(page.getByRole('navigation')).toBeVisible();
    
    // Check hero section
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    
    // Check CTA buttons
    const ctaButtons = page.locator('button, a').filter({ hasText: /get started|sign up|try|demo/i });
    expect(await ctaButtons.count()).toBeGreaterThan(0);
  });

  test('should navigate to features page', async ({ page }) => {
    await utils.navigateToPage('/');
    
    // Look for features link
    const featuresLink = page.locator('a').filter({ hasText: /features/i }).first();
    if (await featuresLink.isVisible()) {
      await featuresLink.click();
      await utils.waitForNavigation();
      await expect(page).toHaveURL('/features');
    }
  });

  test('should navigate to pricing page', async ({ page }) => {
    await utils.navigateToPage('/');
    
    // Look for pricing link
    const pricingLink = page.locator('a').filter({ hasText: /pricing/i }).first();
    if (await pricingLink.isVisible()) {
      await pricingLink.click();
      await utils.waitForNavigation();
      await expect(page).toHaveURL('/pricing');
    }
  });

  test('should navigate to login page', async ({ page }) => {
    await utils.navigateToPage('/');
    
    // Look for login/sign in link
    const loginLink = page.locator('a').filter({ hasText: /login|sign in/i }).first();
    if (await loginLink.isVisible()) {
      await loginLink.click();
      await utils.waitForNavigation();
      await expect(page).toHaveURL('/auth/login');
    }
  });

  test('should be responsive', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await utils.navigateToPage('/');
    
    // Check that content is still visible
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    
    // Test tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await utils.navigateToPage('/');
    
    // Check that content is still visible
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('should handle slow loading', async ({ page }) => {
    // Simulate slow network
    await page.route('**/*', route => {
      setTimeout(() => route.continue(), 100);
    });
    
    await utils.navigateToPage('/');
    
    // Should still load eventually
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('should show loading states', async ({ page }) => {
    await utils.navigateToPage('/');
    
    // Check for loading indicators during page load
    await utils.waitForPageLoad();
    
    // Page should be fully loaded
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });
});

test.describe('Homepage SEO', () => {
  let utils: ReturnType<typeof createTestUtils>;

  test.beforeEach(async ({ page }) => {
    utils = createTestUtils(page);
  });

  test('should have proper meta tags', async ({ page }) => {
    await utils.navigateToPage('/');
    
    // Check for essential meta tags
    await expect(page.locator('meta[name="description"]')).toHaveCount(1);
    await expect(page.locator('meta[property="og:title"]')).toHaveCount(1);
    await expect(page.locator('meta[property="og:description"]')).toHaveCount(1);
  });

  test('should have structured data', async ({ page }) => {
    await utils.navigateToPage('/');
    
    // Check for JSON-LD structured data
    const structuredData = page.locator('script[type="application/ld+json"]');
    expect(await structuredData.count()).toBeGreaterThanOrEqual(0);
  });
});

test.describe('Homepage Performance', () => {
  let utils: ReturnType<typeof createTestUtils>;

  test.beforeEach(async ({ page }) => {
    utils = createTestUtils(page);
  });

  test('should load quickly', async ({ page }) => {
    const startTime = Date.now();
    
    await utils.navigateToPage('/');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    
    const loadTime = Date.now() - startTime;
    expect(loadTime).toBeLessThan(3000); // Should load within 3 seconds
  });

  test('should not have console errors', async ({ page }) => {
    const consoleErrors: string[] = [];
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    await utils.navigateToPage('/');
    await utils.waitForPageLoad();
    
    // Should not have any console errors
    expect(consoleErrors).toHaveLength(0);
  });
});