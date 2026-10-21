-- Apply ONLY to the external shop project hpnnbqsqjiapewvtdgvh (not Lovable Cloud).
-- Orders are created exclusively by the validated server checkout (service_role).
DROP POLICY IF EXISTS "Users can create their own orders" ON public.orders;

REVOKE ALL ON public.orders FROM anon, authenticated;
REVOKE ALL ON public.products FROM anon, authenticated;
GRANT SELECT ON public.products TO anon, authenticated;
GRANT ALL ON public.orders TO service_role;
GRANT ALL ON public.products TO service_role;
