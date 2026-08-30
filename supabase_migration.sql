-- ============================================================
-- LFMoney - Supabase Migration: Tambah Kolom yang Kurang
-- Jalankan script ini di Supabase SQL Editor
-- Aman dijalankan berkali-kali (IF NOT EXISTS)
-- ============================================================

-- Tambah kolom yang kurang di tabel goals
ALTER TABLE public.goals ADD COLUMN IF NOT EXISTS icon TEXT;
ALTER TABLE public.goals ADD COLUMN IF NOT EXISTS color TEXT;
ALTER TABLE public.goals ADD COLUMN IF NOT EXISTS deadline TEXT;
ALTER TABLE public.goals ADD COLUMN IF NOT EXISTS note TEXT;

-- Tambah kolom yang kurang di tabel accounts
ALTER TABLE public.accounts ADD COLUMN IF NOT EXISTS icon TEXT;
ALTER TABLE public.accounts ADD COLUMN IF NOT EXISTS initial_balance NUMERIC DEFAULT 0;
ALTER TABLE public.accounts ADD COLUMN IF NOT EXISTS account_number TEXT;
ALTER TABLE public.accounts ADD COLUMN IF NOT EXISTS color TEXT;

-- Tambah kolom yang kurang di tabel transactions
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS note TEXT;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS category_id TEXT;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS account_id TEXT;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS date TEXT;

-- Tambah kolom yang kurang di tabel categories
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS icon TEXT;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS color TEXT;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS budget NUMERIC DEFAULT 0;

-- Tambah kolom yang kurang di tabel bills
ALTER TABLE public.bills ADD COLUMN IF NOT EXISTS icon TEXT;
ALTER TABLE public.bills ADD COLUMN IF NOT EXISTS frequency TEXT DEFAULT 'Bulanan';
ALTER TABLE public.bills ADD COLUMN IF NOT EXISTS category_id TEXT;
ALTER TABLE public.bills ADD COLUMN IF NOT EXISTS account_id TEXT;
ALTER TABLE public.bills ADD COLUMN IF NOT EXISTS last_paid_date TEXT;

-- Verifikasi: lihat semua kolom di setiap tabel
SELECT table_name, column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('users', 'transactions', 'categories', 'accounts', 'goals', 'bills')
ORDER BY table_name, ordinal_position;
