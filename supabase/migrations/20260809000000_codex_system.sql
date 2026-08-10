-- ─── CODEX(R) System — Supabase Database Migration ─────────────────────────────
-- Run this SQL in your Supabase SQL Editor: https://app.supabase.com/project/ypqthyglthytkwcikczz/sql/new

-- 1. Create CODEX Users & VIP Memberships Table
CREATE TABLE IF NOT EXISTS public.codex_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  telegram_id TEXT UNIQUE NOT NULL,
  username TEXT,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user', -- 'owner', 'vip', 'user'
  plan_expiry BIGINT, -- Milliseconds timestamp (null = no active plan)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.codex_users ENABLE ROW LEVEL SECURITY;

-- Allow public read/write access for extension & bot
CREATE POLICY "Allow public select on codex_users" ON public.codex_users FOR SELECT USING (true);
CREATE POLICY "Allow public insert on codex_users" ON public.codex_users FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on codex_users" ON public.codex_users FOR UPDATE USING (true);

-- 2. Insert / Seed Owners (7794982496 & 7317734631)
INSERT INTO public.codex_users (telegram_id, username, name, role, plan_expiry)
VALUES
  ('7794982496', '@S_14xx', '𝐶𝑜𝑑𝑒𝑟 | ɮʟʊɛʟօօƈӄ | 『 𝙏𝙚𝙖𝙢 𝙉𝙚𝙭𝙪𝙨 』', 'owner', 4102444800000),
  ('7317734631', '@mrcodexofc', '𝐌𝐫. 𝐂𝐎𝐃𝐄𝐗', 'owner', 4102444800000)
ON CONFLICT (telegram_id) DO UPDATE
SET role = 'owner', plan_expiry = 4102444800000;

-- 3. Create Activity Logs Table for Real-time Monitoring
CREATE TABLE IF NOT EXISTS public.codex_activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  log_type TEXT NOT NULL, -- 'INFO', 'GATEWAY', 'TRYING', 'SUCCESS', 'DECLINED', 'REQUIRES_ACTION', 'ERROR'
  message TEXT NOT NULL,
  details TEXT,
  masked_card TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.codex_activity_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public select on codex_activity_logs" ON public.codex_activity_logs FOR SELECT USING (true);
CREATE POLICY "Allow public insert on codex_activity_logs" ON public.codex_activity_logs FOR INSERT WITH CHECK (true);

-- 4. Create Card Fixtures & Test Cases Storage Table
CREATE TABLE IF NOT EXISTS public.codex_test_cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  card_number TEXT NOT NULL,
  expiry_month TEXT NOT NULL,
  expiry_year TEXT NOT NULL,
  cvc TEXT NOT NULL,
  cardholder_name TEXT,
  brand TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.codex_test_cases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public select on codex_test_cases" ON public.codex_test_cases FOR SELECT USING (true);
CREATE POLICY "Allow public insert on codex_test_cases" ON public.codex_test_cases FOR INSERT WITH CHECK (true);
