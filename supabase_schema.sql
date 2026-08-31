-- ============================================================
-- LFMoney - Supabase Database Schema (LENGKAP)
-- PERINGATAN: SCRIPT INI AKAN MENGHAPUS SEMUA TABEL LAMA.
-- Jalankan seluruh script ini di Supabase SQL Editor untuk RESET.
-- ============================================================

-- Hapus tabel lama (agar bersih dan bisa dibuat ulang dengan kolom yang lengkap)
DROP TABLE IF EXISTS public.bills CASCADE;
DROP TABLE IF EXISTS public.goals CASCADE;
DROP TABLE IF EXISTS public.accounts CASCADE;
DROP TABLE IF EXISTS public.categories CASCADE;
DROP TABLE IF EXISTS public.transactions CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

-- 1. Tabel Users / Profil
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    monthly_saving_target NUMERIC DEFAULT 0,
    monthly_budget_total NUMERIC DEFAULT 0,
    dark_mode BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL
);

-- 2. Tabel Transactions
CREATE TABLE IF NOT EXISTS public.transactions (
    id TEXT PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    title TEXT,
    type TEXT NOT NULL,
    amount NUMERIC NOT NULL DEFAULT 0,
    date TEXT,
    category_id TEXT,
    account_id TEXT,
    note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL
);

-- 3. Tabel Categories
CREATE TABLE IF NOT EXISTS public.categories (
    id TEXT PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    icon TEXT,
    color TEXT,
    budget NUMERIC DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL
);

-- 4. Tabel Accounts (Dompet / Rekening)
CREATE TABLE IF NOT EXISTS public.accounts (
    id TEXT PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT,
    icon TEXT,
    color TEXT,
    initial_balance NUMERIC DEFAULT 0,
    account_number TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL
);

-- 5. Tabel Goals (Target Tabungan)
CREATE TABLE IF NOT EXISTS public.goals (
    id TEXT PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    target_amount NUMERIC DEFAULT 0,
    current_amount NUMERIC DEFAULT 0,
    deadline TEXT,
    icon TEXT,
    color TEXT,
    note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL
);

-- 6. Tabel Bills (Tagihan Rutin)
CREATE TABLE IF NOT EXISTS public.bills (
    id TEXT PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    amount NUMERIC DEFAULT 0,
    due_day NUMERIC,
    frequency TEXT DEFAULT 'Bulanan',
    category_id TEXT,
    account_id TEXT,
    icon TEXT,
    is_paid BOOLEAN DEFAULT false,
    last_paid_date TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL
);

-- ============================================================
-- KEAMANAN: Row Level Security (RLS)
-- Setiap user hanya bisa baca/tulis data miliknya sendiri
-- ============================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bills ENABLE ROW LEVEL SECURITY;

-- Drop existing policies jika ada (agar tidak error saat re-run)
DROP POLICY IF EXISTS "Users own profile" ON public.users;
DROP POLICY IF EXISTS "Users own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users own categories" ON public.categories;
DROP POLICY IF EXISTS "Users own accounts" ON public.accounts;
DROP POLICY IF EXISTS "Users own goals" ON public.goals;
DROP POLICY IF EXISTS "Users own bills" ON public.bills;

-- Buat ulang policies
CREATE POLICY "Users own profile" ON public.users FOR ALL USING (auth.uid() = id);
CREATE POLICY "Users own transactions" ON public.transactions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users own categories" ON public.categories FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users own accounts" ON public.accounts FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users own goals" ON public.goals FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users own bills" ON public.bills FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- FUNGSI OTOMATIS: Buat profil user saat Register
-- Dipanggil otomatis oleh Supabase setiap ada user baru
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.email
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Buat trigger agar fungsi dipanggil otomatis saat user baru register
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- REALTIME: Aktifkan fitur Realtime untuk semua tabel
-- Agar web otomatis update tanpa perlu direfresh
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.transactions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.categories;
ALTER PUBLICATION supabase_realtime ADD TABLE public.accounts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.goals;
ALTER PUBLICATION supabase_realtime ADD TABLE public.bills;
