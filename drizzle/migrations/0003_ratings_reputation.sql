ALTER TABLE public.ratings ADD COLUMN IF NOT EXISTS tags text[] NOT NULL DEFAULT '{}';
ALTER TABLE public.ratings ADD COLUMN IF NOT EXISTS rater_role text;
ALTER TABLE public.drivers ADD COLUMN IF NOT EXISTS ratings_count integer NOT NULL DEFAULT 0;
ALTER TABLE public.drivers ADD COLUMN IF NOT EXISTS needs_review boolean NOT NULL DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS passenger_rating_avg numeric(3,2);
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS passenger_ratings_count integer NOT NULL DEFAULT 0;

CREATE OR REPLACE FUNCTION public.validate_rating()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_ride public.rides; v_driver_user uuid;
BEGIN
  SELECT * INTO v_ride FROM public.rides WHERE id = NEW.ride_id;
  IF NOT FOUND OR v_ride.status <> 'COMPLETED' THEN RAISE EXCEPTION 'Ride not completed'; END IF;
  SELECT user_id INTO v_driver_user FROM public.drivers WHERE id = v_ride.driver_id;
  IF NEW.from_user_id = v_ride.passenger_id AND NEW.to_user_id = v_driver_user THEN
    NEW.rater_role := 'passenger';
  ELSIF NEW.from_user_id = v_driver_user AND NEW.to_user_id = v_ride.passenger_id THEN
    NEW.rater_role := 'driver';
  ELSE
    RAISE EXCEPTION 'Not a participant of this ride';
  END IF;
  RETURN NEW;
END $$;

CREATE OR REPLACE FUNCTION public.recalc_reputation()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_avg numeric; v_cnt int;
BEGIN
  SELECT avg(score), count(*) INTO v_avg, v_cnt FROM public.ratings
    WHERE to_user_id = NEW.to_user_id AND rater_role = NEW.rater_role;
  IF NEW.rater_role = 'passenger' THEN
    UPDATE public.drivers SET rating_avg = round(v_avg, 2), ratings_count = v_cnt,
      needs_review = (v_cnt >= 5 AND v_avg < 4.5)
    WHERE user_id = NEW.to_user_id;
  ELSE
    UPDATE public.profiles SET passenger_rating_avg = round(v_avg, 2), passenger_ratings_count = v_cnt
    WHERE user_id = NEW.to_user_id;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_validate_rating ON public.ratings;
CREATE TRIGGER trg_validate_rating BEFORE INSERT ON public.ratings FOR EACH ROW EXECUTE FUNCTION public.validate_rating();
DROP TRIGGER IF EXISTS trg_recalc_reputation ON public.ratings;
CREATE TRIGGER trg_recalc_reputation AFTER INSERT ON public.ratings FOR EACH ROW EXECUTE FUNCTION public.recalc_reputation();

REVOKE EXECUTE ON FUNCTION public.validate_rating() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.recalc_reputation() FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT ON public.ratings TO authenticated;
GRANT ALL ON public.ratings TO service_role;