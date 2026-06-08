
-- ============ PROFILES: referral fields ============
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS referral_code text UNIQUE,
  ADD COLUMN IF NOT EXISTS referred_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS first_ride_bonus_paid boolean NOT NULL DEFAULT false;

CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS text LANGUAGE plpgsql AS $$
DECLARE
  code text;
  exists_count int;
BEGIN
  LOOP
    code := upper(substr(replace(encode(gen_random_bytes(6),'base64'),'/',''),1,6));
    code := regexp_replace(code, '[^A-Z0-9]', 'X', 'g');
    SELECT count(*) INTO exists_count FROM public.profiles WHERE referral_code = code;
    EXIT WHEN exists_count = 0;
  END LOOP;
  RETURN code;
END $$;

CREATE OR REPLACE FUNCTION public.set_referral_code_on_profile()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.referral_code IS NULL THEN
    NEW.referral_code := public.generate_referral_code();
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS profiles_set_referral_code ON public.profiles;
CREATE TRIGGER profiles_set_referral_code
  BEFORE INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_referral_code_on_profile();

-- Backfill existing profiles
UPDATE public.profiles SET referral_code = public.generate_referral_code() WHERE referral_code IS NULL;

-- ============ APPLY REFERRAL ============
CREATE OR REPLACE FUNCTION public.apply_referral_code(_code text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  referrer_user uuid;
  caller uuid := auth.uid();
  current_referred uuid;
BEGIN
  IF caller IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'not_authenticated');
  END IF;
  SELECT user_id INTO referrer_user FROM public.profiles WHERE referral_code = upper(_code);
  IF referrer_user IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'invalid_code');
  END IF;
  IF referrer_user = caller THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'self_referral');
  END IF;
  SELECT referred_by INTO current_referred FROM public.profiles WHERE user_id = caller;
  IF current_referred IS NOT NULL THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'already_referred');
  END IF;
  UPDATE public.profiles SET referred_by = referrer_user WHERE user_id = caller;
  RETURN jsonb_build_object('ok', true);
END $$;

GRANT EXECUTE ON FUNCTION public.apply_referral_code(text) TO authenticated;

-- ============ COUPONS ============
CREATE TABLE IF NOT EXISTS public.coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  description text,
  discount_pct numeric(5,2),
  discount_amount numeric(10,2),
  min_ride_price numeric(10,2) NOT NULL DEFAULT 0,
  max_discount numeric(10,2),
  first_ride_only boolean NOT NULL DEFAULT false,
  usage_limit integer,
  usage_count integer NOT NULL DEFAULT 0,
  valid_from timestamptz NOT NULL DEFAULT now(),
  valid_until timestamptz,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.coupons TO authenticated;
GRANT ALL ON public.coupons TO service_role;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can read active coupons" ON public.coupons
  FOR SELECT TO authenticated USING (is_active = true);
CREATE POLICY "Admins manage coupons" ON public.coupons
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER coupons_update_updated_at BEFORE UPDATE ON public.coupons
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ COUPON REDEMPTIONS ============
CREATE TABLE IF NOT EXISTS public.coupon_redemptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id uuid NOT NULL REFERENCES public.coupons(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ride_id uuid REFERENCES public.rides(id) ON DELETE SET NULL,
  discount_applied numeric(10,2) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (coupon_id, user_id)
);

GRANT SELECT, INSERT ON public.coupon_redemptions TO authenticated;
GRANT ALL ON public.coupon_redemptions TO service_role;
ALTER TABLE public.coupon_redemptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own redemptions" ON public.coupon_redemptions
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own redemptions" ON public.coupon_redemptions
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins view all redemptions" ON public.coupon_redemptions
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- ============ RIDES: discount fields ============
ALTER TABLE public.rides
  ADD COLUMN IF NOT EXISTS coupon_code text,
  ADD COLUMN IF NOT EXISTS discount_amount numeric(10,2) NOT NULL DEFAULT 0;

-- ============ VALIDATE COUPON ============
CREATE OR REPLACE FUNCTION public.validate_coupon(_code text, _ride_price numeric)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  c public.coupons;
  caller uuid := auth.uid();
  discount numeric(10,2) := 0;
  ride_count int;
  already_used int;
BEGIN
  IF caller IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'not_authenticated');
  END IF;
  SELECT * INTO c FROM public.coupons WHERE upper(code) = upper(_code) AND is_active = true;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'invalid_code');
  END IF;
  IF c.valid_until IS NOT NULL AND c.valid_until < now() THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'expired');
  END IF;
  IF c.valid_from > now() THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'not_yet_valid');
  END IF;
  IF c.usage_limit IS NOT NULL AND c.usage_count >= c.usage_limit THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'fully_used');
  END IF;
  IF _ride_price < c.min_ride_price THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'below_minimum', 'min', c.min_ride_price);
  END IF;
  SELECT count(*) INTO already_used FROM public.coupon_redemptions
    WHERE coupon_id = c.id AND user_id = caller;
  IF already_used > 0 THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'already_used');
  END IF;
  IF c.first_ride_only THEN
    SELECT count(*) INTO ride_count FROM public.rides
      WHERE passenger_id = caller AND status = 'COMPLETED';
    IF ride_count > 0 THEN
      RETURN jsonb_build_object('ok', false, 'reason', 'not_first_ride');
    END IF;
  END IF;

  IF c.discount_pct IS NOT NULL THEN
    discount := _ride_price * (c.discount_pct / 100.0);
  ELSIF c.discount_amount IS NOT NULL THEN
    discount := c.discount_amount;
  END IF;
  IF c.max_discount IS NOT NULL AND discount > c.max_discount THEN
    discount := c.max_discount;
  END IF;
  IF discount > _ride_price THEN
    discount := _ride_price;
  END IF;
  discount := round(discount::numeric, 2);

  RETURN jsonb_build_object(
    'ok', true,
    'coupon_id', c.id,
    'code', c.code,
    'discount', discount,
    'final_price', round((_ride_price - discount)::numeric, 2)
  );
END $$;

GRANT EXECUTE ON FUNCTION public.validate_coupon(text, numeric) TO authenticated;

-- ============ REDEEM COUPON (on ride creation) ============
CREATE OR REPLACE FUNCTION public.redeem_coupon(_code text, _ride_id uuid, _discount numeric)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  c public.coupons;
  caller uuid := auth.uid();
BEGIN
  IF caller IS NULL THEN RETURN jsonb_build_object('ok', false); END IF;
  SELECT * INTO c FROM public.coupons WHERE upper(code) = upper(_code) AND is_active = true;
  IF NOT FOUND THEN RETURN jsonb_build_object('ok', false, 'reason', 'invalid'); END IF;

  INSERT INTO public.coupon_redemptions (coupon_id, user_id, ride_id, discount_applied)
    VALUES (c.id, caller, _ride_id, _discount)
    ON CONFLICT (coupon_id, user_id) DO NOTHING;

  UPDATE public.coupons SET usage_count = usage_count + 1 WHERE id = c.id;
  UPDATE public.rides SET coupon_code = c.code, discount_amount = _discount WHERE id = _ride_id;
  RETURN jsonb_build_object('ok', true);
END $$;

GRANT EXECUTE ON FUNCTION public.redeem_coupon(text, uuid, numeric) TO authenticated;

-- ============ REFERRAL BONUS ON FIRST COMPLETED RIDE ============
CREATE OR REPLACE FUNCTION public.grant_referral_bonus_on_complete()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  bonus_amount numeric := 5.00;
  pax_profile public.profiles;
  pax_wallet_id uuid;
  ref_wallet_id uuid;
BEGIN
  IF NEW.status <> 'COMPLETED' OR OLD.status = 'COMPLETED' THEN
    RETURN NEW;
  END IF;
  SELECT * INTO pax_profile FROM public.profiles WHERE user_id = NEW.passenger_id;
  IF pax_profile.first_ride_bonus_paid OR pax_profile.referred_by IS NULL THEN
    RETURN NEW;
  END IF;

  -- passenger wallet
  SELECT id INTO pax_wallet_id FROM public.wallets WHERE user_id = NEW.passenger_id;
  IF pax_wallet_id IS NULL THEN
    INSERT INTO public.wallets (user_id, balance) VALUES (NEW.passenger_id, 0) RETURNING id INTO pax_wallet_id;
  END IF;
  -- referrer wallet
  SELECT id INTO ref_wallet_id FROM public.wallets WHERE user_id = pax_profile.referred_by;
  IF ref_wallet_id IS NULL THEN
    INSERT INTO public.wallets (user_id, balance) VALUES (pax_profile.referred_by, 0) RETURNING id INTO ref_wallet_id;
  END IF;

  INSERT INTO public.wallet_transactions (wallet_id, amount, type, description, reference_id)
    VALUES (pax_wallet_id, bonus_amount, 'credit', 'Bônus de indicação (você foi indicado)', NEW.id::text);
  UPDATE public.wallets SET balance = balance + bonus_amount WHERE id = pax_wallet_id;

  INSERT INTO public.wallet_transactions (wallet_id, amount, type, description, reference_id)
    VALUES (ref_wallet_id, bonus_amount, 'credit', 'Bônus por indicar um amigo', NEW.id::text);
  UPDATE public.wallets SET balance = balance + bonus_amount WHERE id = ref_wallet_id;

  UPDATE public.profiles SET first_ride_bonus_paid = true WHERE user_id = NEW.passenger_id;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS rides_grant_referral_bonus ON public.rides;
CREATE TRIGGER rides_grant_referral_bonus
  AFTER UPDATE OF status ON public.rides
  FOR EACH ROW EXECUTE FUNCTION public.grant_referral_bonus_on_complete();

-- Seed: welcome coupon
INSERT INTO public.coupons (code, description, discount_pct, max_discount, first_ride_only, is_active)
VALUES ('BEMVINDO20', '20% off na primeira corrida', 20, 10, true, true)
ON CONFLICT (code) DO NOTHING;
