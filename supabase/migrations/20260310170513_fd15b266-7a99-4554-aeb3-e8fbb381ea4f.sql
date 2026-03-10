
-- Create enum for ride status
CREATE TYPE public.ride_status AS ENUM (
  'REQUESTED', 'ACCEPTED', 'ARRIVING', 'ARRIVED', 'IN_PROGRESS', 'COMPLETED', 'CANCELED'
);

-- Create enum for payment method
CREATE TYPE public.payment_method AS ENUM ('pix', 'card', 'cash');

-- Create enum for payment status
CREATE TYPE public.payment_status AS ENUM ('pending', 'completed', 'refunded');

-- Create enum for driver status
CREATE TYPE public.driver_status AS ENUM ('available', 'unavailable', 'on_ride');

-- Create enum for app roles
CREATE TYPE public.app_role AS ENUM ('passenger', 'driver', 'admin');

-- Timestamp updater function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- User roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);

-- Auto-assign passenger role on signup
CREATE OR REPLACE FUNCTION public.assign_default_role()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'passenger');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created_role
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.assign_default_role();

-- Drivers table
CREATE TABLE public.drivers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  document TEXT NOT NULL,
  photo_url TEXT,
  plate TEXT NOT NULL,
  moto_model TEXT NOT NULL,
  status driver_status NOT NULL DEFAULT 'unavailable',
  is_approved BOOLEAN NOT NULL DEFAULT false,
  rating_avg NUMERIC(3,2) DEFAULT 0,
  total_rides INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Drivers can view own data" ON public.drivers FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Drivers can update own data" ON public.drivers FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Anyone can view approved drivers" ON public.drivers FOR SELECT USING (is_approved = true);
CREATE POLICY "Admins can manage drivers" ON public.drivers FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_drivers_updated_at BEFORE UPDATE ON public.drivers
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Rides table
CREATE TABLE public.rides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  passenger_id UUID NOT NULL REFERENCES auth.users(id),
  driver_id UUID REFERENCES public.drivers(id),
  origin_address TEXT NOT NULL,
  origin_lat NUMERIC(10,7),
  origin_lng NUMERIC(10,7),
  destination_address TEXT NOT NULL,
  destination_lat NUMERIC(10,7),
  destination_lng NUMERIC(10,7),
  status ride_status NOT NULL DEFAULT 'REQUESTED',
  estimated_price NUMERIC(10,2),
  final_price NUMERIC(10,2),
  estimated_distance_km NUMERIC(10,2),
  estimated_duration_min INTEGER,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  canceled_at TIMESTAMPTZ,
  cancellation_fee NUMERIC(10,2) DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.rides ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Passengers can view own rides" ON public.rides FOR SELECT USING (auth.uid() = passenger_id);
CREATE POLICY "Passengers can create rides" ON public.rides FOR INSERT WITH CHECK (auth.uid() = passenger_id);
CREATE POLICY "Admins can manage rides" ON public.rides FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_rides_updated_at BEFORE UPDATE ON public.rides
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Payments table
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ride_id UUID NOT NULL REFERENCES public.rides(id),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  amount NUMERIC(10,2) NOT NULL,
  method payment_method NOT NULL,
  status payment_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own payments" ON public.payments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own payments" ON public.payments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can manage payments" ON public.payments FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Ratings table
CREATE TABLE public.ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ride_id UUID NOT NULL REFERENCES public.rides(id),
  from_user_id UUID NOT NULL REFERENCES auth.users(id),
  to_user_id UUID NOT NULL REFERENCES auth.users(id),
  score INTEGER NOT NULL CHECK (score >= 1 AND score <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(ride_id, from_user_id)
);
ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view ratings about them" ON public.ratings FOR SELECT USING (auth.uid() = to_user_id OR auth.uid() = from_user_id);
CREATE POLICY "Users can create ratings" ON public.ratings FOR INSERT WITH CHECK (auth.uid() = from_user_id);
CREATE POLICY "Admins can manage ratings" ON public.ratings FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Tariffs config table (for admin)
CREATE TABLE public.tariffs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  base_fare NUMERIC(10,2) NOT NULL DEFAULT 3.00,
  per_km NUMERIC(10,2) NOT NULL DEFAULT 2.00,
  per_minute NUMERIC(10,2) NOT NULL DEFAULT 0.50,
  minimum_fare NUMERIC(10,2) NOT NULL DEFAULT 5.00,
  cancellation_fee NUMERIC(10,2) NOT NULL DEFAULT 3.00,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.tariffs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view active tariffs" ON public.tariffs FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage tariffs" ON public.tariffs FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Insert default tariff
INSERT INTO public.tariffs (base_fare, per_km, per_minute, minimum_fare, cancellation_fee) VALUES (3.00, 2.00, 0.50, 5.00, 3.00);
