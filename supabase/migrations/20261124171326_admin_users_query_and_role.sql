-- Admin user/profile boundary. Auth identities remain owned by Supabase Auth;
-- this layer only manages the DOP Mart profile role and reads mart metrics.

CREATE OR REPLACE FUNCTION public.get_mart_admin_users()
RETURNS JSONB
LANGUAGE PLPGSQL
STABLE
SECURITY DEFINER
SET search_path = mart, public
AS $$
DECLARE
  v_user_id TEXT := auth.uid()::TEXT;
  v_users JSONB;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = v_user_id AND role = 'admin') THEN
    RAISE EXCEPTION 'FORBIDDEN' USING ERRCODE = '42501';
  END IF;

  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'userId', profile.id,
      'floor', profile.floor,
      'role', profile.role,
      'createdAt', profile.created_at,
      'orderCount', COALESCE(order_stats.order_count, 0),
      'totalSpent', COALESCE(order_stats.total_spent, 0)
    ) ORDER BY profile.created_at ASC NULLS LAST, profile.id
  ), '[]'::jsonb)
  INTO v_users
  FROM public.profiles profile
  LEFT JOIN LATERAL (
    SELECT COUNT(DISTINCT o.id)::INTEGER AS order_count,
           COALESCE(SUM(CASE WHEN p.status = 'succeeded' THEN p.amount ELSE 0 END), 0) AS total_spent
    FROM mart.orders o
    LEFT JOIN mart.payments p ON p.order_id = o.id
    WHERE o.customer_id = profile.id
  ) order_stats ON TRUE;

  RETURN v_users;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_mart_user_role(
  p_user_id TEXT,
  p_role TEXT
)
RETURNS JSONB
LANGUAGE PLPGSQL
SECURITY DEFINER
SET search_path = mart, public
AS $$
DECLARE
  v_actor_id TEXT := auth.uid()::TEXT;
  v_target public.profiles%ROWTYPE;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = v_actor_id AND role = 'admin') THEN
    RAISE EXCEPTION 'FORBIDDEN' USING ERRCODE = '42501';
  END IF;

  IF p_role NOT IN ('admin', 'customer') THEN
    RAISE EXCEPTION 'INVALID_USER_ROLE' USING ERRCODE = 'P0001';
  END IF;

  IF p_user_id = v_actor_id AND p_role <> 'admin' THEN
    RAISE EXCEPTION 'CANNOT_CHANGE_OWN_ROLE' USING ERRCODE = 'P0001';
  END IF;

  UPDATE public.profiles
  SET role = p_role, updated_at = now()
  WHERE id = p_user_id
  RETURNING * INTO v_target;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'USER_PROFILE_NOT_FOUND' USING ERRCODE = 'P0001';
  END IF;

  RETURN jsonb_build_object(
    'userId', v_target.id,
    'floor', v_target.floor,
    'role', v_target.role,
    'updatedAt', v_target.updated_at
  );
END;
$$;

REVOKE ALL ON FUNCTION public.get_mart_admin_users() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.update_mart_user_role(TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_mart_admin_users() TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_mart_user_role(TEXT, TEXT) TO authenticated;
