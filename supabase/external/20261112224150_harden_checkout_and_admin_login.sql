-- Apply to the external shop project hpnnbqsqjiapewvtdgvh.
BEGIN;

ALTER TABLE public.orders
  ADD COLUMN checkout_key uuid UNIQUE,
  ADD COLUMN checkout_request_hash text;

CREATE TABLE public.admin_login_limits (
  client_key text PRIMARY KEY,
  window_started_at timestamptz NOT NULL,
  attempts integer NOT NULL
);
ALTER TABLE public.admin_login_limits ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.admin_login_limits FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.admin_login_limits TO service_role;

CREATE INDEX admin_login_limits_window_idx
  ON public.admin_login_limits (window_started_at);

CREATE FUNCTION public.reserve_admin_login_attempt(p_client_key text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  current_time_at timestamptz := statement_timestamp();
  cutoff timestamptz := current_time_at - interval '15 minutes';
BEGIN
  DELETE FROM public.admin_login_limits
    WHERE window_started_at < current_time_at - interval '1 day';

  INSERT INTO public.admin_login_limits AS limits (client_key, window_started_at, attempts)
    VALUES (p_client_key, current_time_at, 1)
    ON CONFLICT (client_key) DO UPDATE
      SET window_started_at = CASE WHEN limits.window_started_at <= cutoff
                                  THEN current_time_at ELSE limits.window_started_at END,
          attempts = CASE WHEN limits.window_started_at <= cutoff
                          THEN 1 ELSE limits.attempts + 1 END
      WHERE limits.window_started_at <= cutoff OR limits.attempts < 5;

  RETURN FOUND;
END;
$$;

REVOKE ALL ON FUNCTION public.reserve_admin_login_attempt(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reserve_admin_login_attempt(text) TO service_role;

COMMIT;
