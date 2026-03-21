
-- Add location columns to drivers for proximity filtering
ALTER TABLE public.drivers ADD COLUMN IF NOT EXISTS location_lat numeric;
ALTER TABLE public.drivers ADD COLUMN IF NOT EXISTS location_lng numeric;

-- Allow authenticated users to insert their own driver record (for registration)
CREATE POLICY "Users can register as driver"
ON public.drivers
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);
