# Onboarding Flow Testing Documentation

## Overview

This directory contains comprehensive tests for the Cultivate HQ onboarding experience. The tests ensure that our brand voice, design system compliance, user interactions, and technical functionality all work correctly.

## Test Structure

### Component Tests

- **`0_Welcome.test.tsx`** - Tests the welcome screen animation, brand voice, and navigation
- **`1_Challenges.test.tsx`** - Tests the challenges screen pattern-breaking content and voice recording
- **`2_Goals.test.tsx`** - Tests goal selection, categorization, and voice memo integration
- **`3_Contacts.test.tsx`** - Tests LinkedIn URL validation, contact import, and strategic analysis

### Hook Tests

- **`useOnboardingState.test.ts`** - Tests the core onboarding state management hook

### Test Utilities

- **`test-utils.tsx`** - Shared test utilities, mocks, and providers

## Running Tests

### All Onboarding Tests
```bash
./scripts/test-onboarding.sh
```

### Individual Test Files
```bash
npm run test src/components/features/onboarding/__tests__/0_Welcome.test.tsx
npm run test src/components/features/onboarding/__tests__/1_Challenges.test.tsx
npm run test src/components/features/onboarding/__tests__/2_Goals.test.tsx
npm run test src/components/features/onboarding/__tests__/3_Contacts.test.tsx
npm run test src/lib/hooks/__tests__/useOnboardingState.test.ts
```

### With Coverage
```bash
npm run test:coverage -- src/components/features/onboarding/
```

### Watch Mode
```bash
npm run test:watch src/components/features/onboarding/
```

## What We Test

### 1. Brand Voice Compliance
- **Pattern-breaking language** - Tests the 85/15 rule implementation
- **Executive sophistication** - Ensures language is appropriate for strategic professionals
- **Strategic honesty** - Validates authentic moments that cut through corporate speak
- **Magnetic advisor personality** - Confirms tone embodies the Cultivate HQ character

### 2. Design System Adherence
- **Typography scale** - Executive-appropriate font sizes and hierarchy
- **Color psychology** - Proper use of sage (wisdom), amber (celebration), plum (premium)
- **Component character** - Confident interactions vs. eager behaviors
- **Premium spacing** - Golden ratio and sophisticated layouts

### 3. User Experience
- **Animation sequences** - Proper timing and visual hierarchy
- **Loading states** - Appropriate messaging during processing
- **Error handling** - Graceful failure and recovery
- **Accessibility** - Screen readers, keyboard navigation, reduced motion

### 4. Functional Requirements
- **Voice recording** - Audio capture and processing workflows
- **API integration** - Contact import, goal creation, voice memo upload
- **State management** - Onboarding progress tracking and persistence
- **Navigation flow** - Screen progression and validation

### 5. Performance Considerations
- **Component lifecycle** - Proper cleanup and memory management
- **Animation performance** - Smooth transitions without blocking
- **API efficiency** - Proper loading states and error boundaries

## Test Patterns

### Mock Strategy
```typescript
// We mock external dependencies but test integration points
vi.mock('@/lib/hooks/useOnboardingState', () => ({
  useOnboardingState: vi.fn(),
}));

// We provide realistic mock data that reflects actual usage
export const mockOnboardingState = {
  currentScreen: 0,
  currentScreenName: 'welcome' as const,
  state: {
    challenge_voice_memo_id: null,
    goal_id: null,
    // ... realistic state structure
  },
  // ... realistic functions
};
```

### Component Testing
```typescript
// Test user interactions, not implementation details
const user = userEvent.setup();
const button = await screen.findByText('Begin your transformation');
await user.click(button);

// Verify expected outcomes
expect(mockNextScreen).toHaveBeenCalled();
```

### Brand Voice Testing
```typescript
// Ensure specific brand language appears
expect(screen.getByText('Where strategic minds cultivate extraordinary outcomes')).toBeInTheDocument();

// Test pattern-breaking moments
expect(screen.getByText(/Most relationship building feels like speed dating in business casual/)).toBeInTheDocument();
```

## Coverage Goals

- **Component coverage**: 95%+ for all onboarding screens
- **Hook coverage**: 100% for useOnboardingState
- **Integration coverage**: Test all major user paths
- **Error coverage**: All error states and recovery flows

## Testing Philosophy

### What We Test
✅ **User behavior** - How components respond to real user interactions  
✅ **Brand compliance** - Specific text and voice requirements  
✅ **Integration points** - API calls and state updates  
✅ **Accessibility** - Screen reader support and keyboard navigation  
✅ **Error handling** - Graceful failures and recovery  

### What We Don't Test
❌ **Implementation details** - Internal component state or methods  
❌ **Third-party libraries** - MUI components, React features  
❌ **Styling specifics** - CSS properties (unless brand-critical)  
❌ **Mock internals** - How our mocks work  

## Common Test Scenarios

### Animation Testing
```typescript
// Wait for elements to appear in sequence
await waitFor(() => {
  expect(screen.getByText('Cultivate HQ')).toBeInTheDocument();
});

await waitFor(() => {
  expect(screen.getByText('Where strategic minds...')).toBeInTheDocument();
}, { timeout: 4000 });
```

### Voice Recording Testing
```typescript
// Simulate voice recording completion
const recordButton = await screen.findByTestId('record-button');
await user.click(recordButton);

// Verify API call with correct data
expect(fetch).toHaveBeenCalledWith('/api/voice-memo/onboarding', 
  expect.objectContaining({
    method: 'POST',
    body: expect.any(FormData),
  })
);
```

### Error Handling Testing
```typescript
// Mock API error
vi.mocked(fetch).mockResolvedValueOnce({
  ok: false,
  json: () => Promise.resolve({ error: 'Test error' }),
} as Response);

// Verify error display
await waitFor(() => {
  expect(screen.getByText(/Test error/)).toBeInTheDocument();
});
```

## Maintenance

### Adding New Tests
1. Follow existing patterns in `test-utils.tsx`
2. Test brand voice compliance for any new copy
3. Verify design system adherence for new components
4. Include both happy path and error scenarios

### Updating Tests
- Update mocks when APIs change
- Refresh brand voice tests when copy is updated
- Modify timing tests if animation sequences change
- Keep coverage above 95% for critical paths

### Debugging Tests
```bash
# Run specific test with debug output
npm run test src/components/features/onboarding/__tests__/0_Welcome.test.tsx -- --reporter=verbose

# Run in watch mode for development
npm run test:watch src/components/features/onboarding/__tests__/
```

## Brand Voice Test Examples

Our tests specifically validate the Cultivate HQ brand voice:

```typescript
// Executive sophistication
expect(screen.getByText('Your time is valuable. Your relationships are invaluable.')).toBeInTheDocument();

// Pattern-breaking honesty (15% rule)
expect(screen.getByText('Most relationship building feels like speed dating in business casual.')).toBeInTheDocument();

// Strategic language
expect(screen.getByText(/What creates friction in your relationship building\?/)).toBeInTheDocument();
expect(screen.getByText(/Specificity unlocks strategic value/)).toBeInTheDocument();

// Magnetic advisor personality
expect(screen.getByText('You deserve better.')).toBeInTheDocument();
```

This ensures our onboarding experience consistently embodies the sophisticated, magnetic advisor personality that executives expect from Cultivate HQ.