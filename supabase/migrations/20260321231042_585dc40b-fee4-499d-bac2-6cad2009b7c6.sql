
CREATE POLICY "Drivers can view own assigned rides"
ON public.rides
FOR SELECT
TO authenticated
USING (
  driver_id IN (
    SELECT id FROM public.drivers WHERE user_id = auth.uid()
  )
);
