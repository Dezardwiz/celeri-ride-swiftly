ALTER TABLE public.drivers ADD COLUMN IF NOT EXISTS rest_until timestamptz NULL;
CREATE INDEX IF NOT EXISTS idx_drivers_rest_until ON public.drivers(rest_until);