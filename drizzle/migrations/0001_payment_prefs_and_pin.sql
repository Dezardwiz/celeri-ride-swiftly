ALTER TABLE public.drivers ADD COLUMN IF NOT EXISTS accepted_payment_methods text[] NOT NULL DEFAULT ARRAY['cash','pix','card'];
ALTER TABLE public.rides ADD COLUMN IF NOT EXISTS payment_method text NOT NULL DEFAULT 'pix';
ALTER TABLE public.rides ADD COLUMN IF NOT EXISTS change_for numeric;
ALTER TABLE public.rides ADD COLUMN IF NOT EXISTS pin_code text;

CREATE OR REPLACE FUNCTION public.offer_ride_to_next_driver(_ride_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_ride public.rides;
  v_driver_id uuid;
  v_expires timestamptz;
BEGIN
  SELECT * INTO v_ride FROM public.rides WHERE id = _ride_id FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('ok', false, 'reason', 'not_found'); END IF;
  IF v_ride.status <> 'REQUESTED' THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'not_requested', 'status', v_ride.status);
  END IF;
  IF v_ride.matching_driver_id IS NOT NULL AND v_ride.matching_expires_at IS NOT NULL AND v_ride.matching_expires_at > now() THEN
    RETURN jsonb_build_object('ok', true, 'driver_id', v_ride.matching_driver_id, 'expires_at', v_ride.matching_expires_at, 'already', true);
  END IF;
  SELECT d.id INTO v_driver_id FROM public.drivers d
  WHERE d.is_approved = true AND d.status = 'available'
    AND (d.rest_until IS NULL OR d.rest_until < now())
    AND d.location_lat IS NOT NULL AND d.location_lng IS NOT NULL
    AND NOT (d.id = ANY(v_ride.declined_driver_ids))
    AND v_ride.payment_method = ANY(d.accepted_payment_methods)
    AND v_ride.origin_lat IS NOT NULL AND v_ride.origin_lng IS NOT NULL
  ORDER BY (6371 * 2 * asin(sqrt(
      power(sin(radians((d.location_lat - v_ride.origin_lat)/2)), 2) +
      cos(radians(v_ride.origin_lat)) * cos(radians(d.location_lat)) *
      power(sin(radians((d.location_lng - v_ride.origin_lng)/2)), 2)))) ASC
  LIMIT 1;
  IF v_driver_id IS NULL THEN
    UPDATE public.rides SET matching_driver_id = NULL, matching_expires_at = NULL WHERE id = _ride_id;
    RETURN jsonb_build_object('ok', false, 'reason', 'no_driver_available');
  END IF;
  v_expires := now() + interval '15 seconds';
  UPDATE public.rides SET matching_driver_id = v_driver_id, matching_expires_at = v_expires WHERE id = _ride_id;
  RETURN jsonb_build_object('ok', true, 'driver_id', v_driver_id, 'expires_at', v_expires);
END;
$$;
REVOKE EXECUTE ON FUNCTION public.offer_ride_to_next_driver(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.offer_ride_to_next_driver(uuid) TO authenticated;