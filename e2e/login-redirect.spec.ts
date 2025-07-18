import { test, expect } from '@playwright/test';

test.describe('Login Redirect Testing', () => {
  test('should redirect /login to /auth/login', async ({ page }) => {
    // Navigate to /login
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    
    // Should be redirected to /auth/login
    await expect(page).toHaveURL('/auth/login');
    
    // Should show the actual login page content
    await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Continue with Google' })).toBeVisible();
  });
  
  test('should handle /login route with proper status code', async ({ page }) => {
    const response = await page.goto('/login');
    
    // Should return 200 (not 500)
    expect(response?.status()).toBe(200);
    
    // Should eventually show login page content
    await page.waitForURL('/auth/login');
    await expect(page.getByText('Welcome back')).toBeVisible();
  });
  
  test('should preserve query parameters during redirect', async ({ page }) => {
    // Navigate to /login with query parameters
    await page.goto('/login?redirect=/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Should preserve the redirect parameter (URL encoded)
    await expect(page).toHaveURL('/auth/login?redirect=%2Fdashboard');
  });
});