-- StudyAI Gemini — Supabase Schema
-- Run this in your Supabase SQL editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Uploads table (tracks daily usage per IP)
CREATE TABLE IF NOT EXISTS uploads (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  ip_address TEXT NOT NULL,
  pdf_name TEXT,
  file_size INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_uploads_ip ON uploads(ip_address);
CREATE INDEX idx_uploads_created ON uploads(created_at);

-- Payments table (tracks weekly access)
CREATE TABLE IF NOT EXISTS payments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  ip_address TEXT NOT NULL,
  reference TEXT UNIQUE NOT NULL,
  amount INTEGER NOT NULL, -- in kobo
  status TEXT NOT NULL DEFAULT 'pending', -- pending, success, failed
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_payments_ip ON payments(ip_address);
CREATE INDEX idx_payments_reference ON payments(reference);
CREATE INDEX idx_payments_expires ON payments(expires_at);

-- Generated content cache (optional — saves API calls)
CREATE TABLE IF NOT EXISTS generated_content (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  pdf_hash TEXT NOT NULL,
  content_type TEXT NOT NULL, -- summary, questions, study_areas
  question_type TEXT, -- for questions: multiple_choice, theory, etc.
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_content_hash ON generated_content(pdf_hash, content_type);

-- Row Level Security
ALTER TABLE uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_content ENABLE ROW LEVEL SECURITY;

-- Service role has full access (used by API routes)
CREATE POLICY "Service role full access on uploads" ON uploads FOR ALL USING (true);
CREATE POLICY "Service role full access on payments" ON payments FOR ALL USING (true);
CREATE POLICY "Service role full access on content" ON generated_content FOR ALL USING (true);
