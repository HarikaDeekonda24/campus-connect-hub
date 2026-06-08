
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS section text;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _role app_role;
  _branches app_branch[];
BEGIN
  _role := COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'student');

  SELECT ARRAY(
    SELECT unnest::app_branch
    FROM jsonb_array_elements_text(
      COALESCE(NEW.raw_user_meta_data->'branches', '[]'::jsonb)
    ) AS unnest
  ) INTO _branches;

  INSERT INTO public.profiles (user_id, name, email, department, branches, roll_number, phone, section, approved)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'department', 'General'),
    _branches,
    NEW.raw_user_meta_data->>'roll_number',
    NEW.raw_user_meta_data->>'phone',
    NEW.raw_user_meta_data->>'section',
    CASE WHEN _role = 'faculty' THEN false ELSE true END
  );

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, _role);

  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
