-- Drop any existing SELECT policies on connections to replace them
DO $$
DECLARE
    pol record;
BEGIN
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'connections' 
          AND cmd = 'SELECT'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.connections', pol.policyname);
    END LOOP;
END
$$;

-- Create a new policy that allows everyone to see accepted connections,
-- and allows users to see their own pending connections.
CREATE POLICY "Connections are viewable by everyone if accepted, else by involved users"
ON public.connections FOR SELECT
USING (
  status = 'accepted' 
  OR auth.uid() = follower_id 
  OR auth.uid() = following_id
);
