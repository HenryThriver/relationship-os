import { Page, expect } from '@playwright/test';

/**
 * Test utilities for E2E testing with Playwright
 */

export class TestUtils {
  constructor(private page: Page) {}

  /**
   * Navigate to a page and wait for it to load
   */
  async navigateToPage(path: string = '/') {
    await this.page.goto(path);
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Wait for and click an element by test id
   */
  async clickByTestId(testId: string) {
    await this.page.click(`[data-testid="${testId}"]`);
  }

  /**
   * Wait for and fill an input by test id
   */
  async fillByTestId(testId: string, value: string) {
    await this.page.fill(`[data-testid="${testId}"]`, value);
  }

  /**
   * Wait for element to be visible by test id
   */
  async waitForTestId(testId: string) {
    await this.page.waitForSelector(`[data-testid="${testId}"]`, { state: 'visible' });
  }

  /**
   * Check if element exists by test id
   */
  async hasTestId(testId: string): Promise<boolean> {
    try {
      await this.page.waitForSelector(`[data-testid="${testId}"]`, { 
        state: 'visible',
        timeout: 5000 
      });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Wait for navigation to complete
   */
  async waitForNavigation() {
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Take a screenshot with a descriptive name
   */
  async takeScreenshot(name: string) {
    await this.page.screenshot({ path: `screenshots/${name}.png` });
  }

  /**
   * Wait for text to appear on page
   */
  async waitForText(text: string) {
    await this.page.waitForSelector(`text=${text}`, { state: 'visible' });
  }

  /**
   * Check if page contains text
   */
  async hasText(text: string): Promise<boolean> {
    try {
      await this.page.waitForSelector(`text=${text}`, { 
        state: 'visible',
        timeout: 5000 
      });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Wait for page to load completely
   */
  async waitForPageLoad() {
    await this.page.waitForLoadState('domcontentloaded');
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Mock authentication state
   */
  async mockAuthenticatedUser() {
    // Mock the auth state in localStorage/sessionStorage
    await this.page.evaluate(() => {
      localStorage.setItem('supabase.auth.token', JSON.stringify({
        access_token: 'mock-access-token',
        refresh_token: 'mock-refresh-token',
        user: {
          id: 'mock-user-id',
          email: 'test@example.com',
          user_metadata: {
            name: 'Test User'
          }
        }
      }));
    });
  }

  /**
   * Clear authentication state
   */
  async clearAuth() {
    await this.page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  }

  /**
   * Wait for loading spinners to disappear
   */
  async waitForLoadingToComplete() {
    // Wait for common loading indicators to disappear
    await this.page.waitForFunction(() => {
      const loadingElements = document.querySelectorAll('[data-testid*="loading"], .loading, .spinner');
      return loadingElements.length === 0;
    }, { timeout: 10000 });
  }

  /**
   * Click and wait for navigation
   */
  async clickAndWait(selector: string) {
    await Promise.all([
      this.page.waitForNavigation(),
      this.page.click(selector)
    ]);
  }

  /**
   * Fill form and submit
   */
  async fillFormAndSubmit(formData: Record<string, string>, submitSelector: string) {
    for (const [field, value] of Object.entries(formData)) {
      await this.page.fill(`[name="${field}"]`, value);
    }
    await this.page.click(submitSelector);
    await this.waitForNavigation();
  }

  /**
   * Check if URL contains path
   */
  async expectUrlToContain(path: string) {
    await expect(this.page).toHaveURL(new RegExp(path));
  }

  /**
   * Wait for element to be hidden
   */
  async waitForHidden(selector: string) {
    await this.page.waitForSelector(selector, { state: 'hidden' });
  }

  /**
   * Scroll to element
   */
  async scrollToElement(selector: string) {
    await this.page.locator(selector).scrollIntoViewIfNeeded();
  }

  /**
   * Wait for API response
   */
  async waitForResponse(urlPattern: string | RegExp) {
    return await this.page.waitForResponse(urlPattern);
  }
}

/**
 * Mock data for testing
 */
export const mockTestData = {
  user: {
    id: 'test-user-id',
    email: 'test@example.com',
    name: 'Test User'
  },
  contact: {
    id: 'test-contact-id',
    name: 'John Doe',
    email: 'john.doe@example.com',
    company: 'Test Company'
  },
  meeting: {
    id: 'test-meeting-id',
    title: 'Test Meeting',
    date: '2024-01-15T10:00:00Z',
    attendees: ['test@example.com', 'john.doe@example.com']
  },
  voiceMemo: {
    id: 'test-voice-memo-id',
    title: 'Test Voice Memo',
    transcription: 'This is a test voice memo transcription',
    duration: 60
  }
};

/**
 * Helper function to create test utils instance
 */
export function createTestUtils(page: Page) {
  return new TestUtils(page);
}