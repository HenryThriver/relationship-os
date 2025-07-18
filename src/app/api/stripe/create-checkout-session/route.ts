import { NextRequest, NextResponse } from 'next/server';
import { stripe, PRICE_CONFIG, PRODUCT_CONFIG } from '@/lib/stripe';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const { priceType, userId } = await request.json();

    if (!priceType || !userId) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    if (!PRICE_CONFIG[priceType as keyof typeof PRICE_CONFIG]) {
      return NextResponse.json(
        { error: 'Invalid price type' },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    
    // Get user data
    const { data: userData, error: userError } = await supabase
      .from('profiles')
      .select('email, full_name')
      .eq('id', userId)
      .single();

    if (userError || !userData) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const priceConfig = PRICE_CONFIG[priceType as keyof typeof PRICE_CONFIG];
    
    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: PRODUCT_CONFIG.name,
              description: PRODUCT_CONFIG.description,
              metadata: {
                features: PRODUCT_CONFIG.features.slice(0, 5).join(', ') + '...',
              },
            },
            unit_amount: priceConfig.amount,
            recurring: {
              interval: priceConfig.interval,
            },
          },
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/pricing`,
      customer_email: userData.email,
      metadata: {
        userId: userId,
        priceType: priceType,
        planName: `${PRODUCT_CONFIG.name} - ${priceType}`,
      },
      subscription_data: {
        metadata: {
          userId: userId,
          priceType: priceType,
        },
      },
      allow_promotion_codes: true,
    });

    return NextResponse.json({ sessionId: session.id });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}