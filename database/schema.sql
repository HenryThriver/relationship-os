-- Relationship OS Database Schema
-- Run this script in your Supabase SQL Editor

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
CREATE TYPE artifact_type AS ENUM (
  'note',
  'meeting', 
  'email',
  'social_interaction',
  'public_content',
  'pog',
  'ask',
  'celebration',
  'follow_up'
);

-- Create contacts table
CREATE TABLE contacts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  company TEXT,
  role TEXT,
  relationship_context TEXT,
  linkedin_url TEXT NULL,
  tags TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create artifacts table
CREATE TABLE artifacts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type artifact_type NOT NULL,
  content TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create indexes for better performance
CREATE INDEX contacts_user_id_idx ON contacts(user_id);
CREATE INDEX contacts_name_idx ON contacts(name);
CREATE INDEX contacts_email_idx ON contacts(email);
CREATE INDEX contacts_company_idx ON contacts(company);
CREATE INDEX contacts_tags_idx ON contacts USING GIN(tags);

CREATE INDEX artifacts_contact_id_idx ON artifacts(contact_id);
CREATE INDEX artifacts_user_id_idx ON artifacts(user_id);
CREATE INDEX artifacts_type_idx ON artifacts(type);
CREATE INDEX artifacts_timestamp_idx ON artifacts(timestamp);
CREATE INDEX artifacts_metadata_idx ON artifacts USING GIN(metadata);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_contacts_updated_at 
  BEFORE UPDATE ON contacts 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_artifacts_updated_at 
  BEFORE UPDATE ON artifacts 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE artifacts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for contacts table
CREATE POLICY "Users can view their own contacts" ON contacts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own contacts" ON contacts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own contacts" ON contacts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own contacts" ON contacts
  FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for artifacts table
CREATE POLICY "Users can view their own artifacts" ON artifacts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own artifacts" ON artifacts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own artifacts" ON artifacts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own artifacts" ON artifacts
  FOR DELETE USING (auth.uid() = user_id);

-- Create helpful views for common queries
CREATE VIEW contact_with_artifact_count AS
SELECT 
  c.*,
  COUNT(a.id) as artifact_count,
  MAX(a.timestamp) as last_interaction
FROM contacts c
LEFT JOIN artifacts a ON c.id = a.contact_id
GROUP BY c.id;

-- Create function to get contact with recent artifacts
CREATE OR REPLACE FUNCTION get_contact_with_recent_artifacts(contact_uuid UUID, limit_count INTEGER DEFAULT 10)
RETURNS TABLE (
  contact_data JSONB,
  recent_artifacts JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    to_jsonb(c.*) as contact_data,
    COALESCE(
      jsonb_agg(
        to_jsonb(a.*) 
        ORDER BY a.timestamp DESC
      ) FILTER (WHERE a.id IS NOT NULL),
      '[]'::jsonb
    ) as recent_artifacts
  FROM contacts c
  LEFT JOIN artifacts a ON c.id = a.contact_id
  WHERE c.id = contact_uuid 
    AND c.user_id = auth.uid()
  GROUP BY c.id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated; 