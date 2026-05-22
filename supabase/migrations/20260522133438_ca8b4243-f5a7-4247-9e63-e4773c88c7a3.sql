
CREATE TABLE public.surge_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  label text NOT NULL,
  day_of_week smallint, -- 0=Sun .. 6=Sat, NULL = todos os dias
  hour_start smallint NOT NULL DEFAULT 0,
  hour_end smallint NOT NULL DEFAULT 24,
  multiplier numeric NOT NULL DEFAULT 1.0 CHECK (multiplier >= 1 AND multiplier <= 3),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.surge_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated reads active surge rules"
ON public.surge_rules FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins manage surge rules"
ON public.surge_rules FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_surge_rules_updated
BEFORE UPDATE ON public.surge_rules
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.get_active_surge()
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_now timestamptz := now() AT TIME ZONE 'America/Sao_Paulo';
  v_dow smallint := EXTRACT(DOW FROM v_now)::smallint;
  v_hour smallint := EXTRACT(HOUR FROM v_now)::smallint;
  v_time_mult numeric := 1.0;
  v_time_label text := NULL;
  v_pending int := 0;
  v_available int := 0;
  v_demand_boost numeric := 0;
  v_final numeric;
  v_label text;
BEGIN
  SELECT multiplier, label INTO v_time_mult, v_time_label
  FROM public.surge_rules
  WHERE is_active = true
    AND (day_of_week IS NULL OR day_of_week = v_dow)
    AND v_hour >= hour_start AND v_hour < hour_end
  ORDER BY multiplier DESC
  LIMIT 1;

  IF v_time_mult IS NULL THEN v_time_mult := 1.0; END IF;

  SELECT count(*) INTO v_pending
  FROM public.rides
  WHERE status = 'REQUESTED' AND created_at > now() - interval '5 minutes';

  SELECT count(*) INTO v_available
  FROM public.drivers
  WHERE is_approved = true AND status = 'available'
    AND (rest_until IS NULL OR rest_until < now());

  IF v_pending > GREATEST(v_available, 1) THEN
    v_demand_boost := LEAST(0.5, 0.1 * (v_pending - v_available));
  END IF;

  v_final := LEAST(3.0, v_time_mult + v_demand_boost);

  IF v_demand_boost > 0 AND v_time_label IS NOT NULL THEN
    v_label := v_time_label || ' + alta demanda';
  ELSIF v_demand_boost > 0 THEN
    v_label := 'Alta demanda';
  ELSE
    v_label := v_time_label;
  END IF;

  RETURN jsonb_build_object(
    'multiplier', round(v_final, 2),
    'label', v_label,
    'pending', v_pending,
    'available', v_available
  );
END;
$$;
