import { test, expect } from '@playwright/test';

test.describe('Authentication Error Testing', () => {
  test('should handle Google OAuth flow and potential errors', async ({ page }) => {
    const errors: string[] = [];
    const networkRequests: string[] = [];
    
    // Listen for console errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    // Listen for network requests
    page.on('request', request => {
      networkRequests.push(`${request.method()} ${request.url()}`);
    });
    
    // Navigate to login page
    await page.goto('/auth/login');
    await page.waitForLoadState('networkidle');
    
    // Click Google sign-in button
    const googleButton = page.getByRole('button', { name: 'Continue with Google' });
    await expect(googleButton).toBeVisible();
    
    // Click the button and see what happens
    await googleButton.click();
    
    // Wait for potential navigation or error
    await page.waitForTimeout(3000);
    
    // Check current URL
    console.log('Current URL after clicking Google sign-in:', page.url());
    
    // Check for error alerts
    const errorAlert = page.locator('[role="alert"]');
    if (await errorAlert.isVisible()) {
      console.log('Error alert found:', await errorAlert.textContent());
    }
    
    // Check for loading state
    const loadingText = page.getByText('Signing in...');
    if (await loadingText.isVisible()) {
      console.log('Loading state found');
    }
    
    // Log all console errors
    if (errors.length > 0) {
      console.log('Console errors:', errors);
    }
    
    // Log relevant network requests
    const authRequests = networkRequests.filter(req => 
      req.includes('auth') || req.includes('supabase') || req.includes('oauth')
    );
    if (authRequests.length > 0) {
      console.log('Auth-related requests:', authRequests);
    }
    
    // Check if we're still on the login page or redirected
    if (page.url().includes('/auth/login')) {
      console.log('Still on login page');
    } else if (page.url().includes('google.com')) {
      console.log('Redirected to Google OAuth');
    } else {
      console.log('Redirected to:', page.url());
    }
  });
  
  test('should handle missing environment variables gracefully', async ({ page }) => {
    const errors: string[] = [];
    
    // Listen for console errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    // Navigate to login page
    await page.goto('/auth/login');
    await page.waitForLoadState('networkidle');
    
    // Check for environment variable errors
    const envErrors = errors.filter(error => 
      error.includes('SUPABASE') || 
      error.includes('environment') || 
      error.includes('Missing')
    );
    
    if (envErrors.length > 0) {
      console.log('Environment variable errors:', envErrors);
    } else {
      console.log('No environment variable errors found');
    }
  });
  
  test('should handle authentication callback errors', async ({ page }) => {
    const errors: string[] = [];
    
    // Listen for console errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    // Try to access callback directly
    await page.goto('/auth/callback');
    await page.waitForLoadState('networkidle');
    
    // Wait for potential redirects or errors
    await page.waitForTimeout(2000);
    
    // Check current URL
    console.log('Callback URL after navigation:', page.url());
    
    // Check for error messages
    const errorAlert = page.locator('[role="alert"]');
    if (await errorAlert.isVisible()) {
      console.log('Callback error alert:', await errorAlert.textContent());
    }
    
    // Check for loading state
    const loadingText = page.getByText('Completing authentication...');
    if (await loadingText.isVisible()) {
      console.log('Callback loading state found');
    }
    
    // Log console errors
    if (errors.length > 0) {
      console.log('Callback console errors:', errors);
    }
  });
  
  test('should test network error scenarios', async ({ page }) => {
    // Mock network failures for auth requests
    await page.route('**/*supabase*/**', route => {
      route.abort('failed');
    });
    
    const errors: string[] = [];
    
    // Listen for console errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    // Navigate to login page
    await page.goto('/auth/login');
    await page.waitForLoadState('networkidle');
    
    // Try to sign in with mocked network failure
    const googleButton = page.getByRole('button', { name: 'Continue with Google' });
    if (await googleButton.isVisible()) {
      await googleButton.click();
      
      // Wait for potential error
      await page.waitForTimeout(2000);
      
      // Check for error alerts
      const errorAlert = page.locator('[role="alert"]');
      if (await errorAlert.isVisible()) {
        console.log('Network error alert:', await errorAlert.textContent());
      }
      
      // Log console errors
      if (errors.length > 0) {
        console.log('Network failure errors:', errors);
      }
    }
  });
});