import { test, expect } from '@playwright/test';

test.describe('Debug Tests', () => {
  test('should navigate to homepage and check basic elements', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Check basic page load
    await expect(page).toHaveTitle(/Cultivate HQ/);
    console.log('Title:', await page.title());
    
    // Check if we can find the main heading
    const heading = page.getByRole('heading', { level: 1 });
    if (await heading.isVisible()) {
      console.log('Main heading found:', await heading.textContent());
    } else {
      console.log('Main heading not found');
    }
    
    // Check navigation links
    const navLinks = page.locator('a').filter({ hasText: /Features|Pricing|Sign In/ });
    const count = await navLinks.count();
    console.log('Navigation links found:', count);
    
    for (let i = 0; i < count; i++) {
      const link = navLinks.nth(i);
      const text = await link.textContent();
      console.log(`Link ${i}: ${text}`);
    }
  });
  
  test('should navigate to login page and check elements', async ({ page }) => {
    await page.goto('/auth/login');
    await page.waitForLoadState('networkidle');
    
    // Check page load
    await expect(page).toHaveTitle(/Cultivate HQ/);
    
    // Check main elements
    const welcomeHeading = page.getByText('Welcome back');
    if (await welcomeHeading.isVisible()) {
      console.log('Welcome heading found');
    } else {
      console.log('Welcome heading not found');
    }
    
    // Check buttons
    const googleButton = page.getByText('Continue with Google');
    if (await googleButton.isVisible()) {
      console.log('Google button found');
    } else {
      console.log('Google button not found');
    }
    
    // Check back button - look for any button with "Back" in text
    const backButton = page.locator('button').filter({ hasText: /Back/i });
    if (await backButton.isVisible()) {
      console.log('Back button found:', await backButton.textContent());
    } else {
      console.log('Back button not found');
    }
    
    // Check get started link
    const getStartedLink = page.locator('a').filter({ hasText: /Get started/i });
    if (await getStartedLink.isVisible()) {
      console.log('Get started link found');
    } else {
      console.log('Get started link not found');
    }
  });

  test('should test Google sign in error handling', async ({ page }) => {
    await page.goto('/auth/login');
    await page.waitForLoadState('networkidle');
    
    // Listen for console errors
    const consoleMessages: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleMessages.push(msg.text());
      }
    });
    
    // Try to click the Google sign-in button
    const googleButton = page.getByRole('button', { name: 'Continue with Google' });
    if (await googleButton.isVisible()) {
      await googleButton.click();
      
      // Wait a bit for any errors to appear
      await page.waitForTimeout(2000);
      
      // Check for error messages on page
      const errorAlert = page.locator('[role="alert"]');
      if (await errorAlert.isVisible()) {
        console.log('Error alert found:', await errorAlert.textContent());
      } else {
        console.log('No error alert found');
      }
      
      // Check for console errors
      if (consoleMessages.length > 0) {
        console.log('Console errors:', consoleMessages);
      } else {
        console.log('No console errors');
      }
    } else {
      console.log('Google button not found');
    }
  });
  
  test('should try to access dashboard without auth', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    console.log('Dashboard URL:', page.url());
    console.log('Dashboard title:', await page.title());
    
    // Check if redirected to login
    if (page.url().includes('/auth/login')) {
      console.log('Redirected to login as expected');
    } else {
      console.log('Not redirected to login');
    }
  });
});