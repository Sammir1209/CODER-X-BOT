-- Migration: 20260808000000_init_checkout_qa.sql
-- Description: Create PostgreSQL schema for Checkout QA Automation with Row Level Security (RLS)

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Projects Table
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  environment VARCHAR(50) NOT NULL DEFAULT 'sandbox',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Authorized Domains Table
CREATE TABLE IF NOT EXISTS public.authorized_domains (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  domain VARCHAR(255) NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Test Cases Table
CREATE TABLE IF NOT EXISTS public.test_cases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  provider VARCHAR(50) NOT NULL DEFAULT 'stripe',
  expected_result VARCHAR(50) NOT NULL DEFAULT 'SUCCESS',
  test_reference VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Test Sessions Table
CREATE TABLE IF NOT EXISTS public.test_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  finished_at TIMESTAMPTZ,
  status VARCHAR(50) NOT NULL DEFAULT 'RUNNING'
);

-- 5. Test Results Table (Logging ONLY non-sensitive metrics)
CREATE TABLE IF NOT EXISTS public.test_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES public.test_sessions(id) ON DELETE CASCADE,
  test_case_id UUID REFERENCES public.test_cases(id) ON DELETE SET NULL,
  result VARCHAR(50) NOT NULL,
  duration_ms INTEGER NOT NULL,
  error_code VARCHAR(100),
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable Row Level Security (RLS) on all tables
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.authorized_domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_results ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Projects
CREATE POLICY "Users can manage their own projects"
  ON public.projects FOR ALL
  USING (auth.uid() = user_id);

-- RLS Policies for Authorized Domains
CREATE POLICY "Users can manage domains for their projects"
  ON public.authorized_domains FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = authorized_domains.project_id
      AND projects.user_id = auth.uid()
    )
  );

-- RLS Policies for Test Cases
CREATE POLICY "Users can manage test cases for their projects"
  ON public.test_cases FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = test_cases.project_id
      AND projects.user_id = auth.uid()
    )
  );

-- RLS Policies for Test Sessions
CREATE POLICY "Users can manage sessions for their projects"
  ON public.test_sessions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = test_sessions.project_id
      AND projects.user_id = auth.uid()
    )
  );

-- RLS Policies for Test Results
CREATE POLICY "Users can view results for their sessions"
  ON public.test_results FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.test_sessions
      JOIN public.projects ON projects.id = test_sessions.project_id
      WHERE test_sessions.id = test_results.session_id
      AND projects.user_id = auth.uid()
    )
  );
