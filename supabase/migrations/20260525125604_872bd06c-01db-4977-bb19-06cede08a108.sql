REVOKE EXECUTE ON FUNCTION public.get_active_surge() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_active_surge() TO authenticated;