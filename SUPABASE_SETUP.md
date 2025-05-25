# Supabase Setup Guide for Relationship OS

This guide will help you set up Supabase for your Relationship OS project.

## 1. Create Supabase Project

1. Go to [Supabase](https://app.supabase.com/)
2. Click "New Project"
3. Choose your organization
4. Enter project details:
   - Name: `relationship-os`
   - Database Password: Generate a strong password
   - Region: Choose closest to your users
5. Click "Create new project"

## 2. Environment Variables Setup

Create a `.env.local` file in your project root with the following variables:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
NODE_ENV=development
```

### Finding Your Supabase Credentials

1. Go to your Supabase project dashboard
2. Click on "Settings" in the sidebar
3. Click on "API" 
4. Copy the Project URL and anon public key

## 3. Database Schema Setup

Run the following SQL commands in your Supabase SQL Editor:

### Enable Required Extensions

```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

### Create Enums

```sql
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
```

### Create Tables

```sql
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
```

### Create Indexes

```sql
CREATE INDEX contacts_user_id_idx ON contacts(user_id);
CREATE INDEX contacts_name_idx ON contacts(name);
CREATE INDEX artifacts_contact_id_idx ON artifacts(contact_id);
CREATE INDEX artifacts_user_id_idx ON artifacts(user_id);
CREATE INDEX artifacts_type_idx ON artifacts(type);
```

### Create Updated At Triggers

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_contacts_updated_at 
  BEFORE UPDATE ON contacts 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_artifacts_updated_at 
  BEFORE UPDATE ON artifacts 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

## 4. Row Level Security (RLS) Policies

```sql
-- Enable RLS
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE artifacts ENABLE ROW LEVEL SECURITY;

-- Contacts policies
CREATE POLICY "Users can view their own contacts" ON contacts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own contacts" ON contacts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own contacts" ON contacts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own contacts" ON contacts
  FOR DELETE USING (auth.uid() = user_id);

-- Artifacts policies
CREATE POLICY "Users can view their own artifacts" ON artifacts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own artifacts" ON artifacts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own artifacts" ON artifacts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own artifacts" ON artifacts
  FOR DELETE USING (auth.uid() = user_id);
```

## 5. Install Dependencies

```bash
npm install @supabase/supabase-js
```

## 6. Generate TypeScript Types

```bash
npm install -g supabase
supabase login
supabase gen types typescript --project-id YOUR_PROJECT_ID --schema public > src/lib/supabase/types.ts
``` 