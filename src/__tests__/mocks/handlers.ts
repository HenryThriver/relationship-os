import { http, HttpResponse } from 'msw';

export const handlers = [
  // Mock Supabase authentication
  http.get('*/auth/v1/user', () => {
    return HttpResponse.json({ user: null });
  }),

  // Mock Supabase session
  http.get('*/auth/v1/session', () => {
    return HttpResponse.json({ session: null });
  }),

  // Mock Stripe API
  http.post('*/v1/checkout/sessions', () => {
    return HttpResponse.json({
      id: 'cs_test_123',
      url: 'https://checkout.stripe.com/pay/cs_test_123',
    });
  }),

  // Mock API routes
  http.get('/api/user/profile', () => {
    return HttpResponse.json({
      id: 'test-user-id',
      email: 'test@example.com',
      name: 'Test User',
    });
  }),

  // Mock other API endpoints as needed
  http.get('/api/*', () => {
    return HttpResponse.json({ message: 'API endpoint mocked' });
  }),
];