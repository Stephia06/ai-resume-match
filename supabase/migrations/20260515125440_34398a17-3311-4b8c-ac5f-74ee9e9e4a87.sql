CREATE POLICY "candidate updates own applications"
ON public.applications
FOR UPDATE
USING (auth.uid() = candidate_id AND has_role(auth.uid(), 'candidate'::app_role))
WITH CHECK (auth.uid() = candidate_id);