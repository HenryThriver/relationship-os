import { loadStripe, Stripe } from '@stripe/stripe-js';
import StripeServer from 'stripe';

// Initialize Stripe client-side
let stripePromise: Promise<Stripe | null> | null = null;

export const getStripe = () => {
  if (!stripePromise) {
    stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);
  }
  return stripePromise;
};

// Initialize Stripe server-side lazily
let _stripe: StripeServer | null = null;

export const getStripeServer = () => {
  if (!_stripe) {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      throw new Error('STRIPE_SECRET_KEY environment variable is not set');
    }
    _stripe = new StripeServer(secretKey, {
      apiVersion: '2025-06-30.basil',
    });
  }
  return _stripe;
};

// Legacy export for backward compatibility
export const stripe = {
  get webhooks() {
    return getStripeServer().webhooks;
  },
  get customers() {
    return getStripeServer().customers;
  },
  get subscriptions() {
    return getStripeServer().subscriptions;
  },
  get checkout() {
    return getStripeServer().checkout;
  },
  get invoices() {
    return getStripeServer().invoices;
  }
};

// Price configurations
export const PRICE_CONFIG = {
  monthly: {
    amount: 30 * 100, // $30 in cents
    interval: 'month' as const,
    priceId: 'price_monthly_cultivate_hq', // This will be set in Stripe dashboard
  },
  yearly: {
    amount: 300 * 100, // $300 in cents
    interval: 'year' as const,
    priceId: 'price_yearly_cultivate_hq', // This will be set in Stripe dashboard
  },
};

export const PRODUCT_CONFIG = {
  name: 'Cultivate HQ Professional',
  description: 'Complete relationship intelligence system for strategic minds',
  features: [
    'AI-powered contact intelligence',
    'Smart follow-up automation',
    'Relationship maintenance system',
    'Generosity-first networking tools',
    'Conversation intelligence',
    'Strategic networking roadmap',
    'Relationship analytics & insights',
    'Smart introduction engine',
    'Context preservation system',
    'Voice memo processing',
    'LinkedIn integration',
    'Gmail integration',
    'Google Calendar sync',
    'Unlimited contacts',
    'Priority support'
  ]
};