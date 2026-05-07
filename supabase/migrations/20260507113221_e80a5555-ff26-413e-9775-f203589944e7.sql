
-- 1. Add accepted_at column to rides (when driver accepted)
ALTER TABLE public.rides
  ADD COLUMN IF NOT EXISTS accepted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS cancellation_reason TEXT,
  ADD COLUMN IF NOT EXISTS canceled_by TEXT CHECK (canceled_by IN ('passenger','driver','system'));

-- Backfill accepted_at for existing accepted rides (best-effort)
UPDATE public.rides SET accepted_at = updated_at
WHERE accepted_at IS NULL AND status IN ('ACCEPTED','ARRIVING','ARRIVED','IN_PROGRESS','COMPLETED');

-- 2. Cancellations log table
CREATE TABLE IF NOT EXISTS public.cancellations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ride_id UUID NOT NULL REFERENCES public.rides(id) ON DELETE CASCADE,
  canceled_by TEXT NOT NULL CHECK (canceled_by IN ('passenger','driver','system')),
  user_id UUID NOT NULL,
  driver_id UUID,
  reason TEXT NOT NULL,
  fee_amount NUMERIC NOT NULL DEFAULT 0,
  ride_status_at_cancel TEXT NOT NULL,
  seconds_since_accept INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cancellations_user ON public.cancellations(user_id);
CREATE INDEX IF NOT EXISTS idx_cancellations_driver ON public.cancellations(driver_id);
CREATE INDEX IF NOT EXISTS idx_cancellations_created ON public.cancellations(created_at DESC);

ALTER TABLE public.cancellations ENABLE ROW LEVEL SECURITY;

-- Users see their own cancellations
CREATE POLICY "Users view own cancellations"
ON public.cancellations FOR SELECT
TO authenticated
USING (auth.uid() = user_id OR EXISTS (
  SELECT 1 FROM public.drivers d
  WHERE d.id = cancellations.driver_id AND d.user_id = auth.uid()
));

-- Admins see all
CREATE POLICY "Admins view all cancellations"
ON public.cancellations FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- 3. Free cancellation window (seconds) and post-arrived fee — store in commission_settings-like config
CREATE TABLE IF NOT EXISTS public.cancellation_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  free_window_seconds INTEGER NOT NULL DEFAULT 120,
  passenger_fee_after_arrived NUMERIC NOT NULL DEFAULT 5.00,
  driver_fee_after_accept NUMERIC NOT NULL DEFAULT 0.00,
  is_active BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.cancellation_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can read cancellation settings"
ON public.cancellation_settings FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins manage cancellation settings"
ON public.cancellation_settings FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Seed default row if empty
INSERT INTO public.cancellation_settings (free_window_seconds, passenger_fee_after_arrived, driver_fee_after_accept)
SELECT 120, 5.00, 0.00
WHERE NOT EXISTS (SELECT 1 FROM public.cancellation_settings);

-- 4. RPC to cancel a ride safely with rules
CREATE OR REPLACE FUNCTION public.cancel_ride(
  _ride_id UUID,
  _canceled_by TEXT,
  _reason TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ride public.rides;
  v_settings public.cancellation_settings;
  v_uid UUID := auth.uid();
  v_driver_user UUID;
  v_seconds INT := NULL;
  v_fee NUMERIC := 0;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF _canceled_by NOT IN ('passenger','driver') THEN
    RAISE EXCEPTION 'Invalid canceled_by';
  END IF;

  SELECT * INTO v_ride FROM public.rides WHERE id = _ride_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Ride not found'; END IF;

  IF v_ride.status IN ('COMPLETED','CANCELED') THEN
    RAISE EXCEPTION 'Ride already finalized';
  END IF;

  -- authorization
  IF _canceled_by = 'passenger' AND v_ride.passenger_id <> v_uid THEN
    RAISE EXCEPTION 'Not your ride';
  END IF;

  IF _canceled_by = 'driver' THEN
    SELECT user_id INTO v_driver_user FROM public.drivers WHERE id = v_ride.driver_id;
    IF v_driver_user <> v_uid THEN
      RAISE EXCEPTION 'Not your ride';
    END IF;
  END IF;

  SELECT * INTO v_settings FROM public.cancellation_settings WHERE is_active = true LIMIT 1;

  IF v_ride.accepted_at IS NOT NULL THEN
    v_seconds := EXTRACT(EPOCH FROM (now() - v_ride.accepted_at))::INT;
  END IF;

  -- fee logic
  IF _canceled_by = 'passenger' THEN
    IF v_ride.status = 'ARRIVED' OR v_ride.status = 'IN_PROGRESS' THEN
      v_fee := COALESCE(v_settings.passenger_fee_after_arrived, 0);
    ELSIF v_seconds IS NOT NULL AND v_seconds > COALESCE(v_settings.free_window_seconds, 120)
          AND v_ride.status IN ('ACCEPTED','ARRIVING') THEN
      v_fee := COALESCE(v_settings.passenger_fee_after_arrived, 0);
    END IF;
  ELSIF _canceled_by = 'driver' THEN
    IF v_ride.status IN ('ARRIVED','IN_PROGRESS') THEN
      v_fee := COALESCE(v_settings.driver_fee_after_accept, 0);
    END IF;
  END IF;

  -- update ride
  UPDATE public.rides
  SET status = 'CANCELED',
      canceled_at = now(),
      canceled_by = _canceled_by,
      cancellation_reason = _reason,
      cancellation_fee = v_fee
  WHERE id = _ride_id;

  -- free up driver
  IF v_ride.driver_id IS NOT NULL THEN
    UPDATE public.drivers SET status = 'available'
    WHERE id = v_ride.driver_id AND status = 'on_ride';
  END IF;

  -- log
  INSERT INTO public.cancellations
    (ride_id, canceled_by, user_id, driver_id, reason, fee_amount, ride_status_at_cancel, seconds_since_accept)
  VALUES
    (_ride_id, _canceled_by, v_uid, v_ride.driver_id, _reason, v_fee, v_ride.status::TEXT, v_seconds);

  RETURN jsonb_build_object('fee', v_fee, 'seconds_since_accept', v_seconds);
END;
$$;

-- 5. Trigger to set accepted_at when status moves to ACCEPTED
CREATE OR REPLACE FUNCTION public.set_accepted_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'ACCEPTED' AND (OLD.status IS DISTINCT FROM 'ACCEPTED') AND NEW.accepted_at IS NULL THEN
    NEW.accepted_at := now();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_accepted_at ON public.rides;
CREATE TRIGGER trg_set_accepted_at
BEFORE UPDATE ON public.rides
FOR EACH ROW EXECUTE FUNCTION public.set_accepted_at();
