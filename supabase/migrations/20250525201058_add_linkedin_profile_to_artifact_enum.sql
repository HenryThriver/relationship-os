-- Add 'linkedin_profile' to artifact_type_enum
ALTER TYPE public.artifact_type_enum ADD VALUE IF NOT EXISTS 'linkedin_profile';
