DROP POLICY IF EXISTS "Faculty/HOD/Admin can create events" ON public.events;
CREATE POLICY "Authenticated users can create events"
ON public.events FOR INSERT TO authenticated
WITH CHECK (auth.uid() = created_by AND status = 'pending');