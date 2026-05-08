-- Saved places
CREATE TABLE IF NOT EXISTS public.saved_places (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  label TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'other', -- home | work | other
  address TEXT NOT NULL,
  lat NUMERIC NOT NULL,
  lng NUMERIC NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_saved_places_user ON public.saved_places(user_id);
ALTER TABLE public.saved_places ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own places" ON public.saved_places
  FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins view all places" ON public.saved_places
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_saved_places_updated
  BEFORE UPDATE ON public.saved_places
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Search history
CREATE TABLE IF NOT EXISTS public.search_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  address TEXT NOT NULL,
  lat NUMERIC,
  lng NUMERIC,
  searched_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_search_history_user_time
  ON public.search_history(user_id, searched_at DESC);
ALTER TABLE public.search_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own history" ON public.search_history
  FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Public share function: anyone with the ride id can read minimal fields
CREATE OR REPLACE FUNCTION public.get_shared_ride(_ride_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ride public.rides;
  v_driver public.drivers;
  v_driver_name TEXT;
BEGIN
  SELECT * INTO v_ride FROM public.rides WHERE id = _ride_id;
  IF NOT FOUND THEN RETURN NULL; END IF;
  IF v_ride.status NOT IN ('ACCEPTED','ARRIVING','ARRIVED','IN_PROGRESS') THEN
    RETURN jsonb_build_object('id', v_ride.id, 'status', v_ride.status, 'closed', true);
  END IF;
  IF v_ride.driver_id IS NOT NULL THEN
    SELECT * INTO v_driver FROM public.drivers WHERE id = v_ride.driver_id;
    SELECT full_name INTO v_driver_name FROM public.profiles WHERE user_id = v_driver.user_id;
  END IF;
  RETURN jsonb_build_object(
    'id', v_ride.id,
    'status', v_ride.status,
    'origin_address', v_ride.origin_address,
    'destination_address', v_ride.destination_address,
    'origin_lat', v_ride.origin_lat,
    'origin_lng', v_ride.origin_lng,
    'destination_lat', v_ride.destination_lat,
    'destination_lng', v_ride.destination_lng,
    'driver', CASE WHEN v_driver.id IS NOT NULL THEN jsonb_build_object(
      'name', COALESCE(v_driver_name, 'Mototaxista'),
      'plate', v_driver.plate,
      'moto_model', v_driver.moto_model,
      'photo_url', v_driver.photo_url,
      'rating', v_driver.rating_avg,
      'lat', v_driver.location_lat,
      'lng', v_driver.location_lng
    ) ELSE NULL END
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_shared_ride(uuid) TO anon, authenticated;