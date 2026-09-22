CREATE OR REPLACE FUNCTION public.generate_referral_code()
 RETURNS text
 LANGUAGE plpgsql
 SET search_path TO 'public', 'extensions'
AS $function$
DECLARE
  code text;
  exists_count int;
BEGIN
  LOOP
    code := upper(substr(replace(encode(extensions.gen_random_bytes(6),'base64'),'/',''),1,6));
    code := regexp_replace(code, '[^A-Z0-9]', 'X', 'g');
    SELECT count(*) INTO exists_count FROM public.profiles WHERE referral_code = code;
    EXIT WHEN exists_count = 0;
  END LOOP;
  RETURN code;
END $function$;