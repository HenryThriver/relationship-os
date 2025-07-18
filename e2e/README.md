# End-to-End Testing with Playwright

This directory contains end-to-end tests for the Relationship OS application using Playwright.

## Setup

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Playwright browsers installed

### Installation

The project already has Playwright configured. To install browsers:

```bash
npx playwright install
```

## Running Tests

### All Tests

```bash
# Run all E2E tests
npm run test:e2e

# Run tests in headed mode (see browser)
npm run test:e2e:headed

# Run tests with debugger
npm run test:e2e:debug
```

### Specific Test Files

```bash
# Run only authentication tests
npx playwright test auth.spec.ts

# Run only homepage tests
npx playwright test homepage.spec.ts

# Run only user journey tests
npx playwright test user-journeys.spec.ts
```

### Test Options

```bash
# Run tests in specific browser
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit

# Run tests in mobile
npx playwright test --project="Mobile Chrome"
npx playwright test --project="Mobile Safari"

# Run tests with trace
npx playwright test --trace on

# Run tests with video
npx playwright test --video on
```

## Test Structure

### Test Files

- `auth.spec.ts` - Authentication flows and protected routes
- `homepage.spec.ts` - Homepage functionality and SEO
- `user-journeys.spec.ts` - Main user workflows and features
- `test-utils.ts` - Shared utilities and helper functions

### Test Utilities

The `test-utils.ts` file provides:

- `TestUtils` class with common actions
- Mock data for testing
- Authentication helpers
- Navigation utilities
- Waiting and assertion helpers

### Configuration

The `playwright.config.ts` file configures:

- Test directory (`./e2e`)
- Browser projects (Chrome, Firefox, Safari, Mobile)
- Base URL (`http://localhost:3000`)
- Automatic dev server startup
- Screenshots and videos on failure
- Trace collection for debugging

## Test Categories

### Authentication Tests

- Login page functionality
- Google OAuth flow
- Protected route access
- Session persistence
- Error handling

### Homepage Tests

- Content display
- Navigation links
- Responsive design
- Performance
- SEO meta tags

### User Journey Tests

- Dashboard functionality
- Contact management
- Voice memo recording
- Onboarding flow
- Settings pages
- Responsive behavior
- Error handling
- Performance
- Accessibility

## Best Practices

### Writing Tests

1. **Use descriptive test names** - Clearly describe what is being tested
2. **Use test utilities** - Leverage the TestUtils class for common actions
3. **Mock authentication** - Use `mockAuthenticatedUser()` for protected routes
4. **Wait for elements** - Use proper waiting strategies instead of hardcoded delays
5. **Test user workflows** - Focus on complete user journeys, not just individual components

### Test Organization

1. **Group related tests** - Use `test.describe()` to organize tests
2. **Use beforeEach hooks** - Set up common test state
3. **Clean up after tests** - Clear authentication and reset state
4. **Use meaningful assertions** - Check for specific elements and behaviors

### Performance

1. **Run tests in parallel** - Configured by default in playwright.config.ts
2. **Use efficient selectors** - Prefer role-based selectors over CSS
3. **Minimize network requests** - Mock external APIs when possible
4. **Use page object patterns** - For complex pages with many interactions

## Debugging

### Local Debugging

```bash
# Run with debugger
npm run test:e2e:debug

# Run specific test with debug
npx playwright test auth.spec.ts --debug
```

### CI/CD Debugging

```bash
# Generate trace files
npx playwright test --trace on

# View trace files
npx playwright show-trace trace.zip
```

### Common Issues

1. **Tests failing due to timing** - Use proper waiting strategies
2. **Authentication issues** - Check mock authentication setup
3. **Element not found** - Verify selectors and wait for elements
4. **Network timeouts** - Increase timeout or mock slow requests

## CI/CD Integration

The tests are configured to run in CI with:

- Retries on failure (2 retries in CI)
- HTML reporter for results
- Screenshots and videos on failure
- Trace collection for debugging

## Reporting

After running tests, view the HTML report:

```bash
npx playwright show-report
```

The report includes:
- Test results and timing
- Screenshots of failures
- Video recordings
- Trace files for debugging
- Performance metrics

## Environment Variables

Set these environment variables for different environments:

```bash
# Test against different base URLs
PLAYWRIGHT_BASE_URL=http://localhost:3000

# Skip browser install in CI
PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1

# Custom test timeout
PLAYWRIGHT_TIMEOUT=30000
```

## Contributing

When adding new tests:

1. Follow the existing test structure
2. Use the TestUtils class for common actions
3. Add proper descriptions and comments
4. Test both happy path and error scenarios
5. Consider mobile and accessibility testing
6. Update this README if adding new test categories