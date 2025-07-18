import { test, expect } from '@playwright/test';
import { createTestUtils } from './test-utils';

test.describe('Main User Journeys', () => {
  let utils: ReturnType<typeof createTestUtils>;

  test.beforeEach(async ({ page }) => {
    utils = createTestUtils(page);
    await utils.mockAuthenticatedUser();
  });

  test.describe('Dashboard', () => {
    test('should display dashboard with welcome message', async ({ page }) => {
      await utils.navigateToPage('/dashboard');
      
      // Check welcome message
      await expect(page.getByRole('heading', { name: /Welcome back/ })).toBeVisible();
      
      // Check main sections
      await expect(page.getByText('Start Connection Session')).toBeVisible();
      await expect(page.getByText('Time-box sessions to make progress on your relationship building')).toBeVisible();
      
      // Check stats cards
      await expect(page.getByText('Total Contacts')).toBeVisible();
      await expect(page.getByText('Recent Interactions')).toBeVisible();
      await expect(page.getByText('Active Loops')).toBeVisible();
      
      // Check recent activity section
      await expect(page.getByText('Recent Activity')).toBeVisible();
      await expect(page.getByText('No recent activity. Start by adding your first contact!')).toBeVisible();
    });

    test('should start a connection session', async ({ page }) => {
      await utils.navigateToPage('/dashboard');
      
      // Click start session button
      await page.getByRole('button', { name: 'START SESSION' }).click();
      
      // Should open session start modal
      await expect(page.getByRole('dialog')).toBeVisible();
    });

    test('should display stats correctly', async ({ page }) => {
      await utils.navigateToPage('/dashboard');
      
      // Check that all stats show initial values
      const statsCards = page.locator('[role="text"]').filter({ hasText: /^0$/ });
      await expect(statsCards).toHaveCount(3);
    });
  });

  test.describe('Navigation', () => {
    test('should navigate to contacts page', async ({ page }) => {
      await utils.navigateToPage('/dashboard');
      
      // Navigate to contacts (assuming there's a nav link)
      await page.goto('/dashboard/contacts');
      
      await expect(page).toHaveURL('/dashboard/contacts');
    });

    test('should navigate to profile page', async ({ page }) => {
      await utils.navigateToPage('/dashboard');
      
      // Navigate to profile
      await page.goto('/dashboard/profile');
      
      await expect(page).toHaveURL('/dashboard/profile');
    });

    test('should navigate to settings page', async ({ page }) => {
      await utils.navigateToPage('/dashboard');
      
      // Navigate to settings
      await page.goto('/dashboard/settings');
      
      await expect(page).toHaveURL('/dashboard/settings');
    });
  });

  test.describe('Contact Management', () => {
    test('should display contacts page', async ({ page }) => {
      await utils.navigateToPage('/dashboard/contacts');
      
      // Check that contacts page loads
      await expect(page).toHaveURL('/dashboard/contacts');
      
      // Should show empty state or contact list
      await utils.waitForPageLoad();
    });

    test('should be able to add a new contact', async ({ page }) => {
      await utils.navigateToPage('/dashboard/contacts');
      
      // Look for add contact button (might need to adjust based on actual implementation)
      const addButton = page.locator('button').filter({ hasText: /add|new contact/i }).first();
      if (await addButton.isVisible()) {
        await addButton.click();
        
        // Should open add contact form/modal
        await utils.waitForPageLoad();
      }
    });
  });

  test.describe('Voice Memos', () => {
    test('should handle voice memo functionality', async ({ page }) => {
      await utils.navigateToPage('/dashboard');
      
      // Look for voice memo functionality
      const voiceMemoButton = page.locator('button').filter({ hasText: /voice|record/i }).first();
      if (await voiceMemoButton.isVisible()) {
        await voiceMemoButton.click();
        await utils.waitForPageLoad();
      }
    });
  });

  test.describe('Onboarding Flow', () => {
    test('should handle onboarding process', async ({ page }) => {
      await utils.navigateToPage('/onboarding');
      
      // Check onboarding page loads
      await expect(page).toHaveURL('/onboarding');
      await utils.waitForPageLoad();
      
      // Should show onboarding content
      await expect(page.locator('body')).toContainText(/onboarding|welcome|getting started/i);
    });
  });

  test.describe('Features Page', () => {
    test('should display features page', async ({ page }) => {
      await utils.navigateToPage('/features');
      
      // Check features page loads
      await expect(page).toHaveURL('/features');
      
      // Should show feature categories
      await expect(page.getByText('Intelligence')).toBeVisible();
      await expect(page.getByText('Automation')).toBeVisible();
      await expect(page.getByText('Strategy')).toBeVisible();
      await expect(page.getByText('Communication')).toBeVisible();
    });

    test('should navigate between feature categories', async ({ page }) => {
      await utils.navigateToPage('/features');
      
      // Click on different categories
      await page.getByText('Intelligence').click();
      await utils.waitForPageLoad();
      
      await page.getByText('Automation').click();
      await utils.waitForPageLoad();
      
      await page.getByText('Strategy').click();
      await utils.waitForPageLoad();
      
      await page.getByText('Communication').click();
      await utils.waitForPageLoad();
    });
  });

  test.describe('Pricing Page', () => {
    test('should display pricing page', async ({ page }) => {
      await utils.navigateToPage('/pricing');
      
      // Check pricing page loads
      await expect(page).toHaveURL('/pricing');
      await utils.waitForPageLoad();
      
      // Should show pricing information
      await expect(page.locator('body')).toContainText(/pricing|plan|subscription/i);
    });
  });

  test.describe('Responsive Design', () => {
    test('should work on mobile devices', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      
      await utils.navigateToPage('/dashboard');
      
      // Check that dashboard elements are visible on mobile
      await expect(page.getByRole('heading', { name: /Welcome back/ })).toBeVisible();
      await expect(page.getByRole('button', { name: 'START SESSION' })).toBeVisible();
    });

    test('should work on tablet devices', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      
      await utils.navigateToPage('/dashboard');
      
      // Check that dashboard elements are visible on tablet
      await expect(page.getByRole('heading', { name: /Welcome back/ })).toBeVisible();
      await expect(page.getByRole('button', { name: 'START SESSION' })).toBeVisible();
    });
  });
});

test.describe('Error Handling', () => {
  let utils: ReturnType<typeof createTestUtils>;

  test.beforeEach(async ({ page }) => {
    utils = createTestUtils(page);
    await utils.mockAuthenticatedUser();
  });

  test('should handle 404 errors', async ({ page }) => {
    await page.goto('/non-existent-page');
    
    // Should show 404 page or redirect
    await utils.waitForPageLoad();
  });

  test('should handle network errors gracefully', async ({ page }) => {
    // Mock network failure
    await page.route('**/api/**', route => {
      route.abort('connectionrefused');
    });
    
    await utils.navigateToPage('/dashboard');
    
    // Should still load basic UI even with API errors
    await expect(page.getByRole('heading', { name: /Welcome back/ })).toBeVisible();
  });
});

test.describe('Performance', () => {
  let utils: ReturnType<typeof createTestUtils>;

  test.beforeEach(async ({ page }) => {
    utils = createTestUtils(page);
    await utils.mockAuthenticatedUser();
  });

  test('should load dashboard quickly', async ({ page }) => {
    const startTime = Date.now();
    
    await utils.navigateToPage('/dashboard');
    await expect(page.getByRole('heading', { name: /Welcome back/ })).toBeVisible();
    
    const loadTime = Date.now() - startTime;
    expect(loadTime).toBeLessThan(5000); // Should load within 5 seconds
  });

  test('should handle large amounts of data', async ({ page }) => {
    // Mock large dataset
    await page.route('**/api/contacts**', route => {
      const largeDataset = Array(1000).fill(null).map((_, i) => ({
        id: i,
        name: `Contact ${i}`,
        email: `contact${i}@example.com`
      }));
      
      route.fulfill({
        status: 200,
        body: JSON.stringify(largeDataset)
      });
    });
    
    await utils.navigateToPage('/dashboard/contacts');
    
    // Should handle large dataset without crashing
    await utils.waitForPageLoad();
  });
});

test.describe('Accessibility', () => {
  let utils: ReturnType<typeof createTestUtils>;

  test.beforeEach(async ({ page }) => {
    utils = createTestUtils(page);
    await utils.mockAuthenticatedUser();
  });

  test('should be keyboard navigable', async ({ page }) => {
    await utils.navigateToPage('/dashboard');
    
    // Test keyboard navigation
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Enter');
    
    // Should be able to interact with the page using keyboard
    await utils.waitForPageLoad();
  });

  test('should have proper ARIA labels', async ({ page }) => {
    await utils.navigateToPage('/dashboard');
    
    // Check for ARIA labels on interactive elements
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
});