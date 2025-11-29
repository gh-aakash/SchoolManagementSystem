
-- Run this in your Supabase SQL Editor to fix the "Permission Denied" error

GRANT ALL ON public.attendance TO authenticated;
GRANT ALL ON public.attendance TO service_role;
GRANT ALL ON public.attendance TO postgres;

-- Also ensure sequences are accessible if you have any (uuid doesn't need it usually, but good practice)
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
