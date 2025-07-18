#!/bin/bash

# Test script for onboarding flow
# Runs all onboarding-related tests with coverage

echo "🧪 Running Onboarding Test Suite"
echo "================================="

# Run onboarding component tests
echo "📱 Testing onboarding components..."
npm run test -- src/components/features/onboarding/__tests__/ --reporter=verbose

echo ""
echo "🎣 Testing onboarding hooks..."
npm run test -- src/lib/hooks/__tests__/useOnboardingState.test.ts --reporter=verbose

echo ""
echo "📊 Generating coverage report for onboarding..."
npm run test:coverage -- src/components/features/onboarding/ src/lib/hooks/useOnboardingState.ts

echo ""
echo "✅ Onboarding test suite complete!"
echo ""
echo "To run individual test files:"
echo "npm run test src/components/features/onboarding/__tests__/0_Welcome.test.tsx"
echo "npm run test src/components/features/onboarding/__tests__/1_Challenges.test.tsx"
echo "npm run test src/components/features/onboarding/__tests__/2_Goals.test.tsx"
echo "npm run test src/components/features/onboarding/__tests__/3_Contacts.test.tsx"
echo "npm run test src/lib/hooks/__tests__/useOnboardingState.test.ts"