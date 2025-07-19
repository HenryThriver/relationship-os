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
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'User not authenticated' },
        { status: 401 }
      );
    }

    // Get user contact data
    const { data: contactData } = await supabase
      .from('contacts')
      .select('email, name')
      .eq('user_id', user.id)
      .eq('is_self', true)
      .single();

    // Use contact data if available, otherwise fallback to auth user data
    const userData = contactData || {
      email: user.email || '',
      name: user.user_metadata?.full_name || 'User'
    };

    if (!userData.email) {
      return NextResponse.json(
        { error: 'User email not found' },
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
        userId: user.id,
        priceType: priceType,
        planName: `${PRODUCT_CONFIG.name} - ${priceType}`,
      },
      subscription_data: {
        metadata: {
          userId: user.id,
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