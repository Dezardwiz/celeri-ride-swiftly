-- Chat messages between passenger and driver during a ride
CREATE TABLE public.ride_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ride_id uuid NOT NULL,
  sender_id uuid NOT NULL,
  sender_role text NOT NULL CHECK (sender_role IN ('passenger','driver')),
  message text NOT NULL CHECK (length(message) > 0 AND length(message) <= 500),
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_ride_messages_ride_id_created_at
  ON public.ride_messages(ride_id, created_at);

GRANT SELECT, INSERT, UPDATE ON public.ride_messages TO authenticated;
GRANT ALL ON public.ride_messages TO service_role;

ALTER TABLE public.ride_messages ENABLE ROW LEVEL SECURITY;

-- Passenger or assigned driver can view messages of their ride
CREATE POLICY "Ride participants can view messages"
ON public.ride_messages
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.rides r
    WHERE r.id = ride_messages.ride_id
      AND (
        r.passenger_id = auth.uid()
        OR r.driver_id IN (SELECT id FROM public.drivers WHERE user_id = auth.uid())
      )
  )
);

-- Only the actual passenger or assigned driver can send messages
CREATE POLICY "Ride participants can send messages"
ON public.ride_messages
FOR INSERT
TO authenticated
WITH CHECK (
  sender_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.rides r
    WHERE r.id = ride_messages.ride_id
      AND r.status IN ('ACCEPTED','ARRIVING','ARRIVED','IN_PROGRESS')
      AND (
        (sender_role = 'passenger' AND r.passenger_id = auth.uid())
        OR (sender_role = 'driver' AND r.driver_id IN (SELECT id FROM public.drivers WHERE user_id = auth.uid()))
      )
  )
);

-- Recipients can mark their own received messages as read
CREATE POLICY "Recipients mark messages as read"
ON public.ride_messages
FOR UPDATE
TO authenticated
USING (
  sender_id <> auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.rides r
    WHERE r.id = ride_messages.ride_id
      AND (
        r.passenger_id = auth.uid()
        OR r.driver_id IN (SELECT id FROM public.drivers WHERE user_id = auth.uid())
      )
  )
);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.ride_messages;
ALTER TABLE public.ride_messages REPLICA IDENTITY FULL;