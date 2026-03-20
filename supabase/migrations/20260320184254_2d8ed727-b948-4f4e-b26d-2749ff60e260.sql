-- Allow drivers to view REQUESTED rides so they can accept them
CREATE POLICY "Drivers can view requested rides"
ON public.rides
FOR SELECT
TO authenticated
USING (
  status = 'REQUESTED'
  AND public.has_role(auth.uid(), 'driver')
);

-- Allow drivers to update rides they accept or are assigned to
CREATE POLICY "Drivers can update rides"
ON public.rides
FOR UPDATE
TO authenticated
USING (
  public.has_role(auth.uid(), 'driver')
  AND (driver_id IS NULL OR driver_id IN (SELECT id FROM public.drivers WHERE user_id = auth.uid()))
)
WITH CHECK (
  public.has_role(auth.uid(), 'driver')
);

-- Enable realtime for rides table
ALTER PUBLICATION supabase_realtime ADD TABLE public.rides;