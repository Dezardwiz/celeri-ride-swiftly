
ALTER TABLE public.rides
  ADD COLUMN IF NOT EXISTS matching_driver_id uuid REFERENCES public.drivers(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS matching_expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS declined_driver_ids uuid[] NOT NULL DEFAULT '{}';

CREATE INDEX IF NOT EXISTS idx_rides_matching_driver ON public.rides(matching_driver_id) WHERE matching_driver_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_rides_status_requested ON public.rides(status) WHERE status = 'REQUESTED';

-- Offer a REQUESTED ride to the nearest eligible driver
CREATE OR REPLACE FUNCTION public.offer_ride_to_next_driver(_ride_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ride public.rides;
  v_driver_id uuid;
  v_expires timestamptz;
BEGIN
  SELECT * INTO v_ride FROM public.rides WHERE id = _ride_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'not_found');
  END IF;

  IF v_ride.status <> 'REQUESTED' THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'not_requested', 'status', v_ride.status);
  END IF;

  -- Don't re-offer if an active offer is still pending
  IF v_ride.matching_driver_id IS NOT NULL
     AND v_ride.matching_expires_at IS NOT NULL
     AND v_ride.matching_expires_at > now() THEN
    RETURN jsonb_build_object(
      'ok', true,
      'driver_id', v_ride.matching_driver_id,
      'expires_at', v_ride.matching_expires_at,
      'already', true
    );
  END IF;

  -- Pick nearest available driver not yet declined, within ~8km
  SELECT d.id INTO v_driver_id
  FROM public.drivers d
  WHERE d.is_approved = true
    AND d.status = 'available'
    AND (d.rest_until IS NULL OR d.rest_until < now())
    AND d.location_lat IS NOT NULL
    AND d.location_lng IS NOT NULL
    AND NOT (d.id = ANY(v_ride.declined_driver_ids))
    AND v_ride.origin_lat IS NOT NULL
    AND v_ride.origin_lng IS NOT NULL
  ORDER BY (
    6371 * 2 * asin(sqrt(
      power(sin(radians((d.location_lat - v_ride.origin_lat)/2)), 2) +
      cos(radians(v_ride.origin_lat)) * cos(radians(d.location_lat)) *
      power(sin(radians((d.location_lng - v_ride.origin_lng)/2)), 2)
    ))
  ) ASC
  LIMIT 1;

  IF v_driver_id IS NULL THEN
    UPDATE public.rides
      SET matching_driver_id = NULL, matching_expires_at = NULL
      WHERE id = _ride_id;
    RETURN jsonb_build_object('ok', false, 'reason', 'no_driver_available');
  END IF;

  v_expires := now() + interval '15 seconds';
  UPDATE public.rides
    SET matching_driver_id = v_driver_id,
        matching_expires_at = v_expires
    WHERE id = _ride_id;

  RETURN jsonb_build_object('ok', true, 'driver_id', v_driver_id, 'expires_at', v_expires);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.offer_ride_to_next_driver(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.offer_ride_to_next_driver(uuid) TO authenticated;

-- Driver accepts the ride that was offered to them
CREATE OR REPLACE FUNCTION public.accept_offered_ride(_ride_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_driver_id uuid;
  v_ride public.rides;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  SELECT id INTO v_driver_id FROM public.drivers WHERE user_id = v_uid;
  IF v_driver_id IS NULL THEN RAISE EXCEPTION 'Driver profile not found'; END IF;

  SELECT * INTO v_ride FROM public.rides WHERE id = _ride_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Ride not found'; END IF;

  IF v_ride.status <> 'REQUESTED' THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'not_available');
  END IF;

  IF v_ride.matching_driver_id IS DISTINCT FROM v_driver_id THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'not_offered_to_you');
  END IF;

  IF v_ride.matching_expires_at IS NOT NULL AND v_ride.matching_expires_at < now() THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'offer_expired');
  END IF;

  UPDATE public.rides
    SET status = 'ACCEPTED',
        driver_id = v_driver_id,
        accepted_at = COALESCE(accepted_at, now()),
        matching_driver_id = NULL,
        matching_expires_at = NULL
    WHERE id = _ride_id;

  UPDATE public.drivers SET status = 'on_ride' WHERE id = v_driver_id;

  RETURN jsonb_build_object('ok', true);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.accept_offered_ride(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.accept_offered_ride(uuid) TO authenticated;

-- Driver declines / lets offer expire
CREATE OR REPLACE FUNCTION public.decline_offered_ride(_ride_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_driver_id uuid;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  SELECT id INTO v_driver_id FROM public.drivers WHERE user_id = v_uid;
  IF v_driver_id IS NULL THEN RAISE EXCEPTION 'Driver profile not found'; END IF;

  UPDATE public.rides
    SET declined_driver_ids = (
          CASE WHEN v_driver_id = ANY(declined_driver_ids)
               THEN declined_driver_ids
               ELSE array_append(declined_driver_ids, v_driver_id)
          END
        ),
        matching_driver_id = CASE WHEN matching_driver_id = v_driver_id THEN NULL ELSE matching_driver_id END,
        matching_expires_at = CASE WHEN matching_driver_id = v_driver_id THEN NULL ELSE matching_expires_at END
    WHERE id = _ride_id
      AND status = 'REQUESTED';

  RETURN jsonb_build_object('ok', true);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.decline_offered_ride(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.decline_offered_ride(uuid) TO authenticated;
