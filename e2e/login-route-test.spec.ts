import { test, expect } from '@playwright/test';

test.describe('Login Route Testing', () => {
  test('should load /login route and check response', async ({ page }) => {
    const errors: string[] = [];
    const networkRequests: { url: string; status: number }[] = [];
    
    // Listen for console errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    // Listen for network responses
    page.on('response', response => {
      networkRequests.push({
        url: response.url(),
        status: response.status()
      });
    });
    
    console.log('Testing /login route...');
    
    try {
      // Navigate to /login
      await page.goto('/login');
      await page.waitForLoadState('networkidle');
      
      // Check current URL
      console.log('Current URL:', page.url());
      
      // Check page title
      const title = await page.title();
      console.log('Page title:', title);
      
      // Check for any error responses
      const errorResponses = networkRequests.filter(req => req.status >= 400);
      if (errorResponses.length > 0) {
        console.log('Error responses:', errorResponses);
      }
      
      // Check for console errors
      if (errors.length > 0) {
        console.log('Console errors:', errors);
      }
      
      // Check if page content loaded
      const bodyContent = await page.textContent('body');
      if (bodyContent && bodyContent.length > 0) {
        console.log('Page content loaded successfully');
        console.log('Content preview:', bodyContent.substring(0, 100) + '...');
      } else {
        console.log('No page content found');
      }
      
      // Check for specific elements that should be on login page
      const welcomeText = page.getByText('Welcome back');
      if (await welcomeText.isVisible()) {
        console.log('Welcome text found - this is the login page');
      } else {
        console.log('Welcome text not found - might be redirected');
      }
      
      // Check for Google sign-in button
      const googleButton = page.getByRole('button', { name: 'Continue with Google' });
      if (await googleButton.isVisible()) {
        console.log('Google sign-in button found');
      } else {
        console.log('Google sign-in button not found');
      }
      
    } catch (error) {
      console.log('Error loading /login:', error);
    }
  });
  
  test('should compare /login vs /auth/login', async ({ page }) => {
    console.log('\n=== Testing /login ===');
    
    try {
      await page.goto('/login');
      await page.waitForLoadState('networkidle');
      
      const loginUrl = page.url();
      const loginTitle = await page.title();
      const loginContent = await page.textContent('body');
      
      console.log('URL after /login:', loginUrl);
      console.log('Title after /login:', loginTitle);
      console.log('Content length:', loginContent?.length || 0);
      
    } catch (error) {
      console.log('Error with /login:', error);
    }
    
    console.log('\n=== Testing /auth/login ===');
    
    try {
      await page.goto('/auth/login');
      await page.waitForLoadState('networkidle');
      
      const authLoginUrl = page.url();
      const authLoginTitle = await page.title();
      const authLoginContent = await page.textContent('body');
      
      console.log('URL after /auth/login:', authLoginUrl);
      console.log('Title after /auth/login:', authLoginTitle);
      console.log('Content length:', authLoginContent?.length || 0);
      
      // Check if they're the same
      if (loginUrl === authLoginUrl) {
        console.log('✅ /login redirects to /auth/login');
      } else {
        console.log('❌ /login and /auth/login are different');
      }
      
    } catch (error) {
      console.log('Error with /auth/login:', error);
    }
  });
  
  test('should check for 404 or server error on /login', async ({ page }) => {
    let response;
    
    try {
      response = await page.goto('/login');
      console.log('Response status:', response?.status());
      console.log('Response status text:', response?.statusText());
      
      if (response?.status() === 404) {
        console.log('❌ /login returns 404 - route does not exist');
      } else if (response?.status() === 500) {
        console.log('❌ /login returns 500 - internal server error');
      } else if (response?.status() === 200) {
        console.log('✅ /login returns 200 - page loads successfully');
      } else {
        console.log('⚠️  /login returns status:', response?.status());
      }
      
    } catch (error) {
      console.log('❌ Error loading /login:', error);
    }
  });
});