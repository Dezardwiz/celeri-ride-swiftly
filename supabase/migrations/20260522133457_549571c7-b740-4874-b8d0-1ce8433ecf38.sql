REVOKE EXECUTE ON FUNCTION public.get_active_surge() FROM anon, public;
GRANT EXECUTE ON FUNCTION public.get_active_surge() TO authenticated;