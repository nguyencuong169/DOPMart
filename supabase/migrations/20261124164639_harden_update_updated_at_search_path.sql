-- Keep the generic timestamp trigger deterministic and safe from search_path
-- shadowing when it runs on tables in different schemas.
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE PLPGSQL
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;
