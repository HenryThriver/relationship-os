import { test, expect } from '@playwright/test';
import { createTestUtils } from './test-utils';

test.describe('Authentication Flow', () => {
  let utils: ReturnType<typeof createTestUtils>;

  test.beforeEach(async ({ page }) => {
    utils = createTestUtils(page);
    await utils.clearAuth();
  });

  test('should display login page correctly', async ({ page }) => {
    await utils.navigateToPage('/auth/login');
    
    // Check page title and heading
    await expect(page).toHaveTitle(/Cultivate HQ/);
    await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Cultivate HQ' }).nth(1)).toBeVisible();
    
    // Check subtitle
    await expect(page.getByText('Continue your journey toward systematic relationship mastery')).toBeVisible();
    
    // Check Google sign-in button
    await expect(page.getByRole('button', { name: 'Continue with Google' })).toBeVisible();
    
    // Check "New to Cultivate HQ?" section
    await expect(page.getByText('New to Cultivate HQ?')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Get started' })).toBeVisible();
    
    // Check legal text
    await expect(page.getByText('By continuing, you agree to our Terms of Service and Privacy Policy')).toBeVisible();
    
    // Check back button
    await expect(page.getByRole('button', { name: 'Back to home' })).toBeVisible();
  });

  test('should navigate back to homepage', async ({ page }) => {
    await utils.navigateToPage('/auth/login');
    
    await page.getByRole('button', { name: 'Back to home' }).click();
    await utils.waitForNavigation();
    
    await expect(page).toHaveURL('/');
  });

  test('should navigate to pricing page', async ({ page }) => {
    await utils.navigateToPage('/auth/login');
    
    await page.getByRole('link', { name: 'Get started' }).click();
    await utils.waitForNavigation();
    
    await expect(page).toHaveURL('/pricing');
  });

  test('should show loading state when clicking Google sign-in', async ({ page }) => {
    await utils.navigateToPage('/auth/login');
    
    const signInButton = page.getByRole('button', { name: 'Continue with Google' });
    await signInButton.click();
    
    // Check loading state
    await expect(page.getByText('Signing in...')).toBeVisible();
    await expect(page.getByRole('progressbar')).toBeVisible();
    
    // Button should be disabled during loading
    await expect(signInButton).toBeDisabled();
  });

  test('should redirect authenticated user to dashboard', async ({ page }) => {
    // Mock authenticated user
    await utils.mockAuthenticatedUser();
    
    await utils.navigateToPage('/auth/login');
    
    // Should show loading state first
    await expect(page.getByText('Redirecting to dashboard...')).toBeVisible();
    
    // Should redirect to dashboard
    await page.waitForURL('/dashboard');
    await expect(page).toHaveURL('/dashboard');
  });

  test('should handle authentication error', async ({ page }) => {
    await utils.navigateToPage('/auth/login');
    
    // Mock network error or auth failure
    await page.route('**/auth/v1/authorize**', route => {
      route.fulfill({
        status: 400,
        body: JSON.stringify({ error: 'invalid_request' })
      });
    });
    
    await page.getByRole('button', { name: 'Continue with Google' }).click();
    
    // Should show error message
    await expect(page.getByRole('alert')).toBeVisible();
  });

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await utils.navigateToPage('/auth/login');
    
    // Check that elements are still visible on mobile
    await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Continue with Google' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Get started' })).toBeVisible();
  });
});

test.describe('Authentication Callback', () => {
  let utils: ReturnType<typeof createTestUtils>;

  test.beforeEach(async ({ page }) => {
    utils = createTestUtils(page);
  });

  test('should handle successful auth callback', async ({ page }) => {
    // Mock successful auth callback
    await page.route('**/auth/callback**', route => {
      route.fulfill({
        status: 200,
        body: JSON.stringify({ success: true })
      });
    });
    
    await utils.navigateToPage('/auth/callback');
    
    // Should redirect to dashboard after successful auth
    await page.waitForURL('/dashboard');
    await expect(page).toHaveURL('/dashboard');
  });

  test('should handle auth callback error', async ({ page }) => {
    // Mock auth callback error
    await page.route('**/auth/callback**', route => {
      route.fulfill({
        status: 400,
        body: JSON.stringify({ error: 'access_denied' })
      });
    });
    
    await utils.navigateToPage('/auth/callback');
    
    // Should redirect to login with error
    await page.waitForURL('/auth/login');
    await expect(page).toHaveURL('/auth/login');
  });
});

test.describe('Protected Route Access', () => {
  let utils: ReturnType<typeof createTestUtils>;

  test.beforeEach(async ({ page }) => {
    utils = createTestUtils(page);
  });

  test('should redirect unauthenticated user to login', async ({ page }) => {
    await utils.clearAuth();
    
    // Try to access protected dashboard
    await utils.navigateToPage('/dashboard');
    
    // Should be redirected to login
    await page.waitForURL('/auth/login');
    await expect(page).toHaveURL('/auth/login');
  });

  test('should allow authenticated user to access dashboard', async ({ page }) => {
    await utils.mockAuthenticatedUser();
    
    await utils.navigateToPage('/dashboard');
    
    // Should be able to access dashboard
    await expect(page).toHaveURL('/dashboard');
  });

  test('should redirect from login to dashboard when authenticated', async ({ page }) => {
    await utils.mockAuthenticatedUser();
    
    await utils.navigateToPage('/auth/login');
    
    // Should be redirected to dashboard
    await page.waitForURL('/dashboard');
    await expect(page).toHaveURL('/dashboard');
  });
});

test.describe('Authentication State Persistence', () => {
  let utils: ReturnType<typeof createTestUtils>;

  test.beforeEach(async ({ page }) => {
    utils = createTestUtils(page);
  });

  test('should persist authentication across page refreshes', async ({ page }) => {
    await utils.mockAuthenticatedUser();
    await utils.navigateToPage('/dashboard');
    
    // Refresh the page
    await page.reload();
    
    // Should still be authenticated
    await expect(page).toHaveURL('/dashboard');
  });

  test('should handle session expiration', async ({ page }) => {
    await utils.mockAuthenticatedUser();
    await utils.navigateToPage('/dashboard');
    
    // Mock session expiration
    await page.evaluate(() => {
      localStorage.removeItem('supabase.auth.token');
    });
    
    // Navigate to another page
    await utils.navigateToPage('/dashboard/contacts');
    
    // Should be redirected to login
    await page.waitForURL('/auth/login');
    await expect(page).toHaveURL('/auth/login');
  });
});