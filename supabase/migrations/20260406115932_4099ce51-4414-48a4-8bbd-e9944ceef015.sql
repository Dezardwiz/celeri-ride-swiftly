
CREATE OR REPLACE FUNCTION public.process_ride_payment(
  _ride_id uuid,
  _passenger_id uuid,
  _driver_id uuid,
  _amount numeric
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _passenger_wallet_id uuid;
  _driver_wallet_id uuid;
  _driver_user_id uuid;
  _commission_pct numeric;
  _commission_amt numeric;
  _driver_amt numeric;
  _passenger_balance numeric;
BEGIN
  -- Get driver's user_id
  SELECT user_id INTO _driver_user_id FROM drivers WHERE id = _driver_id;
  IF _driver_user_id IS NULL THEN
    RAISE EXCEPTION 'Driver not found';
  END IF;

  -- Get passenger wallet
  SELECT id, balance INTO _passenger_wallet_id, _passenger_balance
  FROM wallets WHERE user_id = _passenger_id;

  IF _passenger_wallet_id IS NULL THEN
    RAISE EXCEPTION 'Passenger wallet not found';
  END IF;

  -- Get or create driver wallet
  SELECT id INTO _driver_wallet_id FROM wallets WHERE user_id = _driver_user_id;
  IF _driver_wallet_id IS NULL THEN
    INSERT INTO wallets (user_id, balance) VALUES (_driver_user_id, 0)
    RETURNING id INTO _driver_wallet_id;
  END IF;

  -- Get active commission percentage
  SELECT percentage INTO _commission_pct
  FROM commission_settings WHERE is_active = true LIMIT 1;
  IF _commission_pct IS NULL THEN
    _commission_pct := 15;
  END IF;

  _commission_amt := ROUND(_amount * _commission_pct / 100, 2);
  _driver_amt := _amount - _commission_amt;

  -- Debit passenger wallet
  UPDATE wallets SET balance = balance - _amount WHERE id = _passenger_wallet_id;

  INSERT INTO wallet_transactions (wallet_id, amount, type, description, reference_id)
  VALUES (_passenger_wallet_id, -_amount, 'debit', 'Pagamento de corrida', _ride_id);

  -- Commission transaction (on passenger wallet for record)
  INSERT INTO wallet_transactions (wallet_id, amount, type, description, reference_id)
  VALUES (_passenger_wallet_id, -_commission_amt, 'commission', 'Comissão administrativa', _ride_id);

  -- Credit driver wallet
  UPDATE wallets SET balance = balance + _driver_amt WHERE id = _driver_wallet_id;

  INSERT INTO wallet_transactions (wallet_id, amount, type, description, reference_id)
  VALUES (_driver_wallet_id, _driver_amt, 'credit', 'Recebimento de corrida (líquido)', _ride_id);

  -- Create payout record
  INSERT INTO driver_payouts (driver_id, gross_amount, commission_amount, amount, status)
  VALUES (_driver_id, _amount, _commission_amt, _driver_amt, 'pending');

  RETURN true;
END;
$$;
