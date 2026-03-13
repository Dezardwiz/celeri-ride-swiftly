CREATE POLICY "Passengers can update own rides"
ON public.rides
FOR UPDATE
TO authenticated
USING (auth.uid() = passenger_id)
WITH CHECK (auth.uid() = passenger_id);