-- ============================================================
-- RecoveryCircleApp — Complete Database Schema
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New query)
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 1. PROFILES (extends auth.users)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name       TEXT,
  email           TEXT UNIQUE NOT NULL,
  role            TEXT NOT NULL DEFAULT 'user'
                  CHECK (role IN ('superadmin', 'admin', 'guide', 'user')),
  karma_coins     INTEGER NOT NULL DEFAULT 0 CHECK (karma_coins >= 0),
  avatar_url      TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- 2. SUBSCRIPTIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id                        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id                   UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  stripe_subscription_id    TEXT UNIQUE,
  tier                      INTEGER NOT NULL CHECK (tier IN (10, 20, 30)),
  status                    TEXT NOT NULL DEFAULT 'active'
                            CHECK (status IN ('active', 'cancelled', 'past_due')),
  created_at                TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at                TIMESTAMPTZ
);

CREATE INDEX idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX idx_subscriptions_status  ON public.subscriptions(status);

-- ============================================================
-- 3. WALLET TRANSACTIONS (ledger)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.wallet_transactions (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount        INTEGER NOT NULL,            -- positive = credit, negative handled by type
  type          TEXT NOT NULL CHECK (type IN ('credit', 'debit')),
  source        TEXT NOT NULL
                CHECK (source IN ('stripe', 'reward', 'meeting_registration', 'store_purchase', 'manual')),
  reference_id  TEXT,                        -- Stripe session ID, order ID, meeting ID, etc.
  description   TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_wallet_user_id    ON public.wallet_transactions(user_id);
CREATE INDEX idx_wallet_created_at ON public.wallet_transactions(created_at DESC);

-- ============================================================
-- 4. MEETINGS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.meetings (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title            TEXT NOT NULL,
  description      TEXT,
  date             DATE NOT NULL,
  start_time       TIME NOT NULL,
  end_time         TIME NOT NULL,
  capacity         INTEGER NOT NULL DEFAULT 20 CHECK (capacity > 0),
  type             TEXT NOT NULL CHECK (type IN ('certification', 'guide')),
  host_id          UUID REFERENCES public.profiles(id) ON DELETE SET NULL,  -- Guide
  created_by       UUID REFERENCES public.profiles(id) ON DELETE SET NULL,  -- Admin
  status           TEXT NOT NULL DEFAULT 'upcoming'
                   CHECK (status IN ('upcoming', 'ended', 'cancelled')),
  karma_coins_cost INTEGER NOT NULL DEFAULT 0 CHECK (karma_coins_cost >= 0),
  zoom_session_id  TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT no_end_before_start CHECK (end_time > start_time)
);

CREATE INDEX idx_meetings_date   ON public.meetings(date);
CREATE INDEX idx_meetings_status ON public.meetings(status);
CREATE INDEX idx_meetings_host   ON public.meetings(host_id);

-- Overlap prevention function (same date, overlapping times)
CREATE OR REPLACE FUNCTION public.check_meeting_overlap()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.meetings
    WHERE id <> COALESCE(NEW.id, uuid_generate_v4())
      AND date = NEW.date
      AND status <> 'cancelled'
      AND start_time < NEW.end_time
      AND end_time > NEW.start_time
  ) THEN
    RAISE EXCEPTION 'A meeting already exists in this time slot on %', NEW.date;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER meetings_no_overlap
  BEFORE INSERT OR UPDATE ON public.meetings
  FOR EACH ROW EXECUTE FUNCTION public.check_meeting_overlap();

-- ============================================================
-- 5. MEETING REGISTRATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.meeting_registrations (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  meeting_id   UUID NOT NULL REFERENCES public.meetings(id) ON DELETE CASCADE,
  user_id      UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  coins_paid   INTEGER NOT NULL DEFAULT 0,
  registered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (meeting_id, user_id)
);

CREATE INDEX idx_reg_meeting ON public.meeting_registrations(meeting_id);
CREATE INDEX idx_reg_user    ON public.meeting_registrations(user_id);

-- ============================================================
-- 6. REWARD REQUESTS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.reward_requests (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  meeting_id     UUID NOT NULL REFERENCES public.meetings(id) ON DELETE CASCADE,
  guide_id       UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  requested_by   UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount         INTEGER NOT NULL CHECK (amount > 0),
  description    TEXT,
  status         TEXT NOT NULL DEFAULT 'pending'
                 CHECK (status IN ('pending', 'approved', 'rejected')),
  processed_by   UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  processed_at   TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_reward_guide_id  ON public.reward_requests(guide_id);
CREATE INDEX idx_reward_status    ON public.reward_requests(status);
CREATE INDEX idx_reward_meeting   ON public.reward_requests(meeting_id);

-- ============================================================
-- 7. CATEGORIES (Store)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.categories (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT UNIQUE NOT NULL,
  description TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 8. PRODUCTS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.products (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title        TEXT NOT NULL,
  description  TEXT,
  price_coins  INTEGER NOT NULL CHECK (price_coins > 0),
  category_id  UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  image_url    TEXT,
  stock        INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  is_active    BOOLEAN NOT NULL DEFAULT true,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_products_category ON public.products(category_id);
CREATE INDEX idx_products_active   ON public.products(is_active);

CREATE TRIGGER products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- 9. ORDERS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.orders (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status       TEXT NOT NULL DEFAULT 'pending'
               CHECK (status IN ('pending', 'completed', 'cancelled')),
  total_coins  INTEGER NOT NULL CHECK (total_coins >= 0),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_orders_user_id ON public.orders(user_id);
CREATE INDEX idx_orders_status  ON public.orders(status);

CREATE TRIGGER orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- 10. ORDER ITEMS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.order_items (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id    UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id  UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  quantity    INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  price_coins INTEGER NOT NULL CHECK (price_coins > 0)
);

CREATE INDEX idx_order_items_order   ON public.order_items(order_id);
CREATE INDEX idx_order_items_product ON public.order_items(product_id);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

ALTER TABLE public.profiles           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meetings            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meeting_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reward_requests     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items         ENABLE ROW LEVEL SECURITY;

-- Helper: get current user role
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS TEXT LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

-- PROFILES
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT USING (id = auth.uid());
CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT USING (current_user_role() IN ('superadmin', 'admin'));
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE USING (id = auth.uid());
CREATE POLICY "Superadmin can manage all profiles"
  ON public.profiles FOR ALL USING (current_user_role() = 'superadmin');

-- SUBSCRIPTIONS
CREATE POLICY "Users see own subscriptions"
  ON public.subscriptions FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Admins see all subscriptions"
  ON public.subscriptions FOR SELECT USING (current_user_role() IN ('superadmin', 'admin'));

-- WALLET TRANSACTIONS
CREATE POLICY "Users see own transactions"
  ON public.wallet_transactions FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Admins see all transactions"
  ON public.wallet_transactions FOR SELECT USING (current_user_role() IN ('superadmin', 'admin'));

-- MEETINGS
CREATE POLICY "Anyone authenticated can view meetings"
  ON public.meetings FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admins can manage meetings"
  ON public.meetings FOR ALL USING (current_user_role() IN ('superadmin', 'admin'));

-- MEETING REGISTRATIONS
CREATE POLICY "Users see own registrations"
  ON public.meeting_registrations FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can register"
  ON public.meeting_registrations FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Admins see all registrations"
  ON public.meeting_registrations FOR SELECT USING (current_user_role() IN ('superadmin', 'admin'));

-- REWARD REQUESTS
CREATE POLICY "Guides see own requests"
  ON public.reward_requests FOR SELECT USING (guide_id = auth.uid());
CREATE POLICY "Admins manage reward requests"
  ON public.reward_requests FOR ALL USING (current_user_role() IN ('superadmin', 'admin'));

-- CATEGORIES & PRODUCTS (public read, admin write)
CREATE POLICY "Anyone can view categories"
  ON public.categories FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admins manage categories"
  ON public.categories FOR ALL USING (current_user_role() IN ('superadmin', 'admin'));

CREATE POLICY "Anyone can view active products"
  ON public.products FOR SELECT USING (auth.uid() IS NOT NULL AND is_active = true);
CREATE POLICY "Admins manage products"
  ON public.products FOR ALL USING (current_user_role() IN ('superadmin', 'admin'));

-- ORDERS
CREATE POLICY "Users see own orders"
  ON public.orders FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can create orders"
  ON public.orders FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Admins see all orders"
  ON public.orders FOR SELECT USING (current_user_role() IN ('superadmin', 'admin'));
CREATE POLICY "Admins update orders"
  ON public.orders FOR UPDATE USING (current_user_role() IN ('superadmin', 'admin'));

-- ORDER ITEMS
CREATE POLICY "Users see own order items"
  ON public.order_items FOR SELECT
  USING (order_id IN (SELECT id FROM public.orders WHERE user_id = auth.uid()));
CREATE POLICY "Admins see all order items"
  ON public.order_items FOR SELECT USING (current_user_role() IN ('superadmin', 'admin'));
CREATE POLICY "Users can insert order items"
  ON public.order_items FOR INSERT
  WITH CHECK (order_id IN (SELECT id FROM public.orders WHERE user_id = auth.uid()));

-- ============================================================
-- SEED: Default categories
-- ============================================================
INSERT INTO public.categories (name, description) VALUES
  ('Books',       'Physical and digital recovery books'),
  ('Courses',     'Online learning materials'),
  ('Merchandise', 'RecoveryCircle branded items'),
  ('Wellness',    'Wellness and self-care products')
ON CONFLICT (name) DO NOTHING;
