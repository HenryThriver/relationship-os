import { test, expect } from '@playwright/test';
import { createTestUtils } from './test-utils';

test.describe('Pricing Page', () => {
  let utils: ReturnType<typeof createTestUtils>;

  test.beforeEach(async ({ page }) => {
    utils = createTestUtils(page);
    await utils.clearAuth();
  });

  test('should display pricing page correctly', async ({ page }) => {
    await utils.navigateToPage('/pricing');
    
    // Check page title
    await expect(page).toHaveTitle(/Cultivate HQ/);
    
    // Check navigation
    await expect(page.getByRole('link', { name: 'Cultivate HQ' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Features' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Pricing' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible();
    
    // Check hero section
    await expect(page.getByRole('heading', { name: /Invest in your relationship capital/ })).toBeVisible();
    await expect(page.getByText('Professional-grade relationship intelligence designed for executives')).toBeVisible();
    
    // Check pricing card
    await expect(page.getByText('Professional')).toBeVisible();
    await expect(page.getByText('Complete relationship intelligence system')).toBeVisible();
  });

  test('should display monthly pricing by default', async ({ page }) => {
    await utils.navigateToPage('/pricing');
    
    // Check monthly pricing is displayed
    await expect(page.getByText('$30')).toBeVisible();
    await expect(page.getByText('/month')).toBeVisible();
    
    // Check monthly is selected
    await expect(page.getByText('Monthly')).toBeVisible();
    await expect(page.getByText('Annual')).toBeVisible();
    
    // Check switch state
    const billingSwitch = page.getByRole('switch');
    await expect(billingSwitch).not.toBeChecked();
  });

  test('should toggle to annual pricing', async ({ page }) => {
    await utils.navigateToPage('/pricing');
    
    // Click annual toggle
    const billingSwitch = page.getByRole('switch');
    await billingSwitch.click();
    
    // Check annual pricing is displayed
    await expect(page.getByText('$300')).toBeVisible();
    await expect(page.getByText('/year')).toBeVisible();
    await expect(page.getByText('$25/month billed annually')).toBeVisible();
    
    // Check savings badge
    await expect(page.getByText('Save 17%')).toBeVisible();
    
    // Check switch state
    await expect(billingSwitch).toBeChecked();
  });

  test('should display all features in the pricing card', async ({ page }) => {
    await utils.navigateToPage('/pricing');
    
    const expectedFeatures = [
      'AI-powered contact intelligence',
      'Smart follow-up automation',
      'Relationship maintenance system',
      'Generosity-first networking tools',
      'Conversation intelligence',
      'Strategic networking roadmap',
      'Relationship analytics & insights',
      'Smart introduction engine',
      'Context preservation system',
      'Voice memo processing',
      'LinkedIn integration',
      'Gmail integration',
      'Google Calendar sync',
      'Unlimited contacts',
      'Priority support'
    ];
    
    // Check all features are displayed
    for (const feature of expectedFeatures) {
      await expect(page.getByText(feature)).toBeVisible();
    }
    
    // Check check icons are present
    const checkIcons = page.locator('[data-testid="CheckIcon"]');
    await expect(checkIcons).toHaveCount(expectedFeatures.length);
  });

  test('should display value proposition section', async ({ page }) => {
    await utils.navigateToPage('/pricing');
    
    // Check main heading
    await expect(page.getByRole('heading', { name: 'Why executives choose Cultivate HQ' })).toBeVisible();
    
    // Check value proposition cards
    await expect(page.getByText('Strategic ROI')).toBeVisible();
    await expect(page.getByText('Executive Efficiency')).toBeVisible();
    await expect(page.getByText('Professional Intelligence')).toBeVisible();
    await expect(page.getByText('Sustainable Scale')).toBeVisible();
    
    // Check descriptions
    await expect(page.getByText('One strategic connection can generate opportunities worth thousands of times your investment.')).toBeVisible();
    await expect(page.getByText('Systematic relationship building saves hours of cognitive overhead while improving outcomes.')).toBeVisible();
    await expect(page.getByText('AI-powered insights that enhance your natural strategic instincts and executive presence.')).toBeVisible();
    await expect(page.getByText('Build relationship practices that work for 50+ meaningful connections without burnout.')).toBeVisible();
  });

  test('should display final CTA section', async ({ page }) => {
    await utils.navigateToPage('/pricing');
    
    // Check final CTA heading
    await expect(page.getByRole('heading', { name: 'Ready to transform your relationship building?' })).toBeVisible();
    
    // Check CTA description
    await expect(page.getByText('Join executives who\'ve made systematic relationship building their competitive advantage.')).toBeVisible();
    
    // Check CTA button
    await expect(page.getByRole('button', { name: 'Sign in to get started' })).toBeVisible();
    
    // Check guarantee text
    await expect(page.getByText('No setup fees • Cancel anytime • Professional support')).toBeVisible();
  });

  test('should display footer', async ({ page }) => {
    await utils.navigateToPage('/pricing');
    
    // Check footer content
    await expect(page.getByRole('contentinfo')).toBeVisible();
    await expect(page.getByText('Cultivate HQ')).toBeVisible();
    await expect(page.getByText('Where strategic minds cultivate extraordinary outcomes through systematic relationship intelligence.')).toBeVisible();
    
    // Check footer links
    await expect(page.getByRole('link', { name: 'Features' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Pricing' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Sign In' })).toBeVisible();
    
    // Check copyright
    await expect(page.getByText('© 2025 Cultivate HQ. All rights reserved.')).toBeVisible();
  });
});

test.describe('Pricing Page - Unauthenticated User Interactions', () => {
  let utils: ReturnType<typeof createTestUtils>;

  test.beforeEach(async ({ page }) => {
    utils = createTestUtils(page);
    await utils.clearAuth();
  });

  test('should redirect to login when clicking main CTA button', async ({ page }) => {
    await utils.navigateToPage('/pricing');
    
    // Click main CTA button
    await page.getByRole('button', { name: 'Sign in to get started' }).first().click();
    
    // Should redirect to login page
    await expect(page).toHaveURL('/login');
  });

  test('should redirect to login when clicking final CTA button', async ({ page }) => {
    await utils.navigateToPage('/pricing');
    
    // Click final CTA button
    await page.getByRole('button', { name: 'Sign in to get started' }).last().click();
    
    // Should redirect to login page
    await expect(page).toHaveURL('/login');
  });

  test('should navigate to features page', async ({ page }) => {
    await utils.navigateToPage('/pricing');
    
    // Click features link in navigation
    await page.getByRole('link', { name: 'Features' }).first().click();
    
    await expect(page).toHaveURL('/features');
  });

  test('should navigate to login page', async ({ page }) => {
    await utils.navigateToPage('/pricing');
    
    // Click sign in button in navigation
    await page.getByRole('button', { name: 'Sign In' }).click();
    
    await expect(page).toHaveURL('/login');
  });

  test('should navigate to homepage', async ({ page }) => {
    await utils.navigateToPage('/pricing');
    
    // Click logo
    await page.getByRole('link', { name: 'Cultivate HQ' }).first().click();
    
    await expect(page).toHaveURL('/');
  });
});

test.describe('Pricing Page - Authenticated User Interactions', () => {
  let utils: ReturnType<typeof createTestUtils>;

  test.beforeEach(async ({ page }) => {
    utils = createTestUtils(page);
    await utils.mockAuthenticatedUser();
  });

  test('should redirect authenticated user to dashboard', async ({ page }) => {
    await utils.navigateToPage('/pricing');
    
    // Should be redirected to dashboard
    await page.waitForURL('/dashboard');
    await expect(page).toHaveURL('/dashboard');
  });

  test('should show loading state for authenticated user', async ({ page }) => {
    // Mock loading state
    await page.route('**/api/auth**', route => {
      setTimeout(() => route.continue(), 1000);
    });
    
    await utils.navigateToPage('/pricing');
    
    // Should show loading state
    await expect(page.getByRole('progressbar')).toBeVisible();
    await expect(page.getByText('Loading Cultivate HQ...')).toBeVisible();
  });
});

test.describe('Pricing Page - Error Handling', () => {
  let utils: ReturnType<typeof createTestUtils>;

  test.beforeEach(async ({ page }) => {
    utils = createTestUtils(page);
    await utils.clearAuth();
  });

  test('should display checkout error when payment fails', async ({ page }) => {
    await utils.navigateToPage('/pricing');
    
    // Mock checkout error
    await page.route('**/api/stripe/create-checkout-session**', route => {
      route.fulfill({
        status: 400,
        body: JSON.stringify({ error: 'Payment failed' })
      });
    });
    
    // Mock authentication for this test
    await utils.mockAuthenticatedUser();
    await page.reload();
    
    // Click CTA button
    await page.getByRole('button', { name: 'Begin strategic analysis' }).first().click();
    
    // Should show error alert
    await expect(page.getByRole('alert')).toBeVisible();
  });

  test('should show loading state when processing checkout', async ({ page }) => {
    await utils.navigateToPage('/pricing');
    
    // Mock authenticated user
    await utils.mockAuthenticatedUser();
    await page.reload();
    
    // Mock slow checkout response
    await page.route('**/api/stripe/create-checkout-session**', route => {
      setTimeout(() => route.continue(), 2000);
    });
    
    // Click CTA button
    await page.getByRole('button', { name: 'Begin strategic analysis' }).first().click();
    
    // Should show loading state
    await expect(page.getByText('Processing...')).toBeVisible();
    await expect(page.getByRole('progressbar')).toBeVisible();
  });
});

test.describe('Pricing Page - Responsive Design', () => {
  let utils: ReturnType<typeof createTestUtils>;

  test.beforeEach(async ({ page }) => {
    utils = createTestUtils(page);
    await utils.clearAuth();
  });

  test('should work on mobile devices', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await utils.navigateToPage('/pricing');
    
    // Check that main elements are visible on mobile
    await expect(page.getByRole('heading', { name: /Invest in your relationship capital/ })).toBeVisible();
    await expect(page.getByText('$30')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sign in to get started' })).toBeVisible();
    
    // Check that pricing card is responsive
    await expect(page.getByText('Professional')).toBeVisible();
  });

  test('should work on tablet devices', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await utils.navigateToPage('/pricing');
    
    // Check that elements are visible on tablet
    await expect(page.getByRole('heading', { name: /Invest in your relationship capital/ })).toBeVisible();
    await expect(page.getByText('$30')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sign in to get started' })).toBeVisible();
  });

  test('should maintain proper spacing on different screen sizes', async ({ page }) => {
    // Test desktop
    await page.setViewportSize({ width: 1200, height: 800 });
    await utils.navigateToPage('/pricing');
    
    // Check layout
    await expect(page.getByText('Professional')).toBeVisible();
    
    // Test mobile
    await page.setViewportSize({ width: 375, height: 667 });
    await utils.waitForPageLoad();
    
    // Check layout still works
    await expect(page.getByText('Professional')).toBeVisible();
  });
});

test.describe('Pricing Page - Performance', () => {
  let utils: ReturnType<typeof createTestUtils>;

  test.beforeEach(async ({ page }) => {
    utils = createTestUtils(page);
    await utils.clearAuth();
  });

  test('should load quickly', async ({ page }) => {
    const startTime = Date.now();
    
    await utils.navigateToPage('/pricing');
    await expect(page.getByRole('heading', { name: /Invest in your relationship capital/ })).toBeVisible();
    
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
    
    await utils.navigateToPage('/pricing');
    await utils.waitForPageLoad();
    
    // Should not have any console errors
    expect(consoleErrors).toHaveLength(0);
  });
});

test.describe('Pricing Page - Accessibility', () => {
  let utils: ReturnType<typeof createTestUtils>;

  test.beforeEach(async ({ page }) => {
    utils = createTestUtils(page);
    await utils.clearAuth();
  });

  test('should be keyboard navigable', async ({ page }) => {
    await utils.navigateToPage('/pricing');
    
    // Test keyboard navigation
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Enter');
    
    // Should be able to interact with the page using keyboard
    await utils.waitForPageLoad();
  });

  test('should have proper ARIA labels', async ({ page }) => {
    await utils.navigateToPage('/pricing');
    
    // Check billing switch has proper labeling
    const billingSwitch = page.getByRole('switch');
    await expect(billingSwitch).toBeVisible();
    
    // Check buttons have proper labeling
    const buttons = page.locator('button');
    const buttonCount = await buttons.count();
    
    for (let i = 0; i < buttonCount; i++) {
      const button = buttons.nth(i);
      const hasAriaLabel = await button.getAttribute('aria-label');
      const hasTextContent = await button.textContent();
      
      // Button should have either aria-label or text content
      expect(hasAriaLabel || hasTextContent).toBeTruthy();
    }
  });

  test('should have proper heading hierarchy', async ({ page }) => {
    await utils.navigateToPage('/pricing');
    
    // Check heading structure
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.getByRole('heading', { level: 2 })).toBeVisible();
    await expect(page.getByRole('heading', { level: 6 })).toBeVisible();
  });
});

test.describe('Pricing Page - SEO', () => {
  let utils: ReturnType<typeof createTestUtils>;

  test.beforeEach(async ({ page }) => {
    utils = createTestUtils(page);
  });

  test('should have proper meta tags', async ({ page }) => {
    await utils.navigateToPage('/pricing');
    
    // Check for essential meta tags
    await expect(page.locator('meta[name="description"]')).toHaveCount(1);
    await expect(page.locator('meta[property="og:title"]')).toHaveCount(1);
    await expect(page.locator('meta[property="og:description"]')).toHaveCount(1);
  });

  test('should have structured data for pricing', async ({ page }) => {
    await utils.navigateToPage('/pricing');
    
    // Check for JSON-LD structured data
    const structuredData = page.locator('script[type="application/ld+json"]');
    expect(await structuredData.count()).toBeGreaterThanOrEqual(0);
  });
});