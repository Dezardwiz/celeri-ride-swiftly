
-- Transaction type enum
CREATE TYPE public.wallet_transaction_type AS ENUM ('credit', 'debit', 'commission', 'payout', 'refund');

-- Payout status enum
CREATE TYPE public.payout_status AS ENUM ('pending', 'paid', 'canceled');

-- Wallets table
CREATE TABLE public.wallets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  balance NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own wallet" ON public.wallets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own wallet" ON public.wallets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can manage wallets" ON public.wallets FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_wallets_updated_at BEFORE UPDATE ON public.wallets
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Wallet transactions table
CREATE TABLE public.wallet_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet_id UUID NOT NULL REFERENCES public.wallets(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  type wallet_transaction_type NOT NULL,
  description TEXT,
  reference_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own transactions" ON public.wallet_transactions FOR SELECT
USING (wallet_id IN (SELECT id FROM public.wallets WHERE user_id = auth.uid()));
CREATE POLICY "Users can insert own transactions" ON public.wallet_transactions FOR INSERT
WITH CHECK (wallet_id IN (SELECT id FROM public.wallets WHERE user_id = auth.uid()));
CREATE POLICY "Admins can manage transactions" ON public.wallet_transactions FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Commission settings table
CREATE TABLE public.commission_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  percentage NUMERIC NOT NULL DEFAULT 15,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.commission_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active commission" ON public.commission_settings FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage commission" ON public.commission_settings FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_commission_settings_updated_at BEFORE UPDATE ON public.commission_settings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default commission
INSERT INTO public.commission_settings (percentage, is_active) VALUES (15, true);

-- Driver payouts table
CREATE TABLE public.driver_payouts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  driver_id UUID NOT NULL REFERENCES public.drivers(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  commission_amount NUMERIC NOT NULL DEFAULT 0,
  gross_amount NUMERIC NOT NULL DEFAULT 0,
  status payout_status NOT NULL DEFAULT 'pending',
  period_start TIMESTAMP WITH TIME ZONE,
  period_end TIMESTAMP WITH TIME ZONE,
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.driver_payouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Drivers can view own payouts" ON public.driver_payouts FOR SELECT
USING (driver_id IN (SELECT id FROM public.drivers WHERE user_id = auth.uid()));
CREATE POLICY "Admins can manage payouts" ON public.driver_payouts FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_driver_payouts_updated_at BEFORE UPDATE ON public.driver_payouts
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to create wallet for user automatically
CREATE OR REPLACE FUNCTION public.create_wallet_for_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.wallets (user_id, balance) VALUES (NEW.id, 0);
  RETURN NEW;
END;
$$;
