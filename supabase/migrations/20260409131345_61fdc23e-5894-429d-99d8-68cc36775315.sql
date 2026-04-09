
-- Update the trigger function to handle metadata fields
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _role app_role;
  _branches app_branch[];
  _branch_text text;
BEGIN
  _role := COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'student');
  
  -- Parse branches from metadata
  SELECT ARRAY(
    SELECT unnest::app_branch 
    FROM jsonb_array_elements_text(
      COALESCE(NEW.raw_user_meta_data->'branches', '[]'::jsonb)
    ) AS unnest
  ) INTO _branches;

  INSERT INTO public.profiles (user_id, name, email, department, branches, roll_number, approved)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'department', 'General'),
    _branches,
    NEW.raw_user_meta_data->>'roll_number',
    CASE WHEN _role = 'faculty' THEN false ELSE true END
  );
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, _role);
  
  RETURN NEW;
END;
$$;
