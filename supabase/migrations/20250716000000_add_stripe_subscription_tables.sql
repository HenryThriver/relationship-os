-- Add subscription-related fields to existing contacts table for self-contact profiles
ALTER TABLE public.contacts 
ADD COLUMN IF NOT EXISTS subscription_status text,
ADD COLUMN IF NOT EXISTS subscription_plan text,
ADD COLUMN IF NOT EXISTS stripe_customer_id text,
ADD COLUMN IF NOT EXISTS stripe_subscription_id text;

-- Create subscriptions table for tracking subscription details
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    stripe_subscription_id text UNIQUE NOT NULL,
    stripe_customer_id text NOT NULL,
    status text NOT NULL,
    plan_type text NOT NULL,
    last_payment_date timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Create profiles view that bridges the gap between contacts and auth.users
CREATE OR REPLACE VIEW public.profiles AS
SELECT 
    c.user_id as id,
    c.email,
    c.name as full_name,
    c.subscription_status,
    c.subscription_plan,
    c.stripe_customer_id,
    c.stripe_subscription_id,
    c.updated_at
FROM public.contacts c
WHERE c.is_self_contact = true;

-- Enable RLS on subscriptions table
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS policies for subscriptions
CREATE POLICY "Users can view their own subscriptions" ON public.subscriptions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own subscriptions" ON public.subscriptions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own subscriptions" ON public.subscriptions
    FOR UPDATE USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_subscription_id ON public.subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer_id ON public.subscriptions(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_contacts_subscription_status ON public.contacts(subscription_status) WHERE is_self_contact = true;

-- Add trigger to update the updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_subscriptions_updated_at
    BEFORE UPDATE ON public.subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON public.subscriptions TO authenticated;
GRANT SELECT ON public.profiles TO authenticated;

-- Comments for documentation
COMMENT ON TABLE public.subscriptions IS 'Stores Stripe subscription details for users';
COMMENT ON VIEW public.profiles IS 'View that provides user profile data including subscription status';
COMMENT ON COLUMN public.contacts.subscription_status IS 'Stripe subscription status for self-contact profiles';
COMMENT ON COLUMN public.contacts.subscription_plan IS 'Subscription plan type (monthly/yearly) for self-contact profiles';
COMMENT ON COLUMN public.contacts.stripe_customer_id IS 'Stripe customer ID for self-contact profiles';
COMMENT ON COLUMN public.contacts.stripe_subscription_id IS 'Stripe subscription ID for self-contact profiles';