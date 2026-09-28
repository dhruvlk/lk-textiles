-- Migration: 20260928000001_landing_legal_content.sql
-- Description: Dedicated Landing Page legal-content table for Privacy Policy and Terms & Conditions.
-- Isolated completely from Challan System tables.

CREATE TABLE IF NOT EXISTS landing_legal_content (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL UNIQUE CHECK (type IN ('privacy_policy', 'terms_conditions')),
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  content TEXT NOT NULL,
  is_published BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_landing_legal_content_type ON landing_legal_content (type);
CREATE INDEX IF NOT EXISTS idx_landing_legal_content_published ON landing_legal_content (is_published);

-- Enable Row Level Security
ALTER TABLE landing_legal_content ENABLE ROW LEVEL SECURITY;

-- Allow public read-only access for published legal documents
CREATE POLICY "Allow public read access for published legal content"
  ON landing_legal_content
  FOR SELECT
  USING (is_published = true);

-- Allow service_role full administrative access
CREATE POLICY "Allow service_role full access to landing_legal_content"
  ON landing_legal_content
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
