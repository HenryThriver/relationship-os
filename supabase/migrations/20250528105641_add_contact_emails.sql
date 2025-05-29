-- Migration: Add email support to contacts
-- File: supabase/migrations/20250528105641_add_contact_emails.sql

-- Add primary email field if not exists
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'contacts' AND column_name = 'email'
    ) THEN
        ALTER TABLE contacts ADD COLUMN email TEXT;
    END IF;
END $$;

-- Create emails table for multiple email addresses per contact
CREATE TABLE IF NOT EXISTS contact_emails (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    email_type TEXT DEFAULT 'other' CHECK (email_type IN ('primary', 'work', 'personal', 'other')),
    is_primary BOOLEAN DEFAULT false,
    verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure email format is valid
    CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    
    -- Prevent duplicate emails per contact
    UNIQUE(contact_id, email),
    
    -- Only one primary email per contact
    EXCLUDE (contact_id WITH =) WHERE (is_primary = true)
);

-- Add indexes for performance
CREATE INDEX idx_contact_emails_contact_id ON contact_emails(contact_id);
CREATE INDEX idx_contact_emails_email ON contact_emails(email);
CREATE INDEX idx_contact_emails_primary ON contact_emails(contact_id, is_primary) WHERE is_primary = true;

-- Enable RLS
ALTER TABLE contact_emails ENABLE ROW LEVEL SECURITY;

-- RLS policy for contact emails
CREATE POLICY "Users can manage emails for their contacts" ON contact_emails
    FOR ALL USING (
        contact_id IN (
            SELECT id FROM contacts WHERE user_id = auth.uid()
        )
    );

-- Function to automatically sync primary email to contacts.email field
CREATE OR REPLACE FUNCTION sync_primary_email()
RETURNS TRIGGER AS $$
BEGIN
    -- If setting a new primary email
    IF NEW.is_primary = true THEN
        -- Update the contact's main email field
        UPDATE contacts 
        SET email = NEW.email, updated_at = NOW()
        WHERE id = NEW.contact_id;
        
        -- Unset other primary emails for this contact
        UPDATE contact_emails 
        SET is_primary = false, updated_at = NOW()
        WHERE contact_id = NEW.contact_id 
        AND id != NEW.id 
        AND is_primary = true;
    END IF;
    
    -- If removing primary status, clear contact.email if it matches
    IF OLD.is_primary = true AND NEW.is_primary = false THEN
        UPDATE contacts 
        SET email = NULL, updated_at = NOW()
        WHERE id = NEW.contact_id AND email = OLD.email;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for primary email sync
CREATE TRIGGER sync_primary_email_trigger
    AFTER INSERT OR UPDATE ON contact_emails
    FOR EACH ROW
    EXECUTE FUNCTION sync_primary_email();

-- Function to handle email deletion
CREATE OR REPLACE FUNCTION handle_email_deletion()
RETURNS TRIGGER AS $$
BEGIN
    -- If deleting primary email, clear contact.email
    IF OLD.is_primary = true THEN
        UPDATE contacts 
        SET email = NULL, updated_at = NOW()
        WHERE id = OLD.contact_id AND email = OLD.email;
    END IF;
    
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for email deletion
CREATE TRIGGER handle_email_deletion_trigger
    AFTER DELETE ON contact_emails
    FOR EACH ROW
    EXECUTE FUNCTION handle_email_deletion(); 