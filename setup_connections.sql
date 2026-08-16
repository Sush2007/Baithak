-- Create the connections table
CREATE TABLE connections (
    follower_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    following_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (follower_id, following_id)
);

-- Enable RLS
ALTER TABLE connections ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Public profiles are viewable by everyone."
ON connections FOR SELECT
USING ( true );

CREATE POLICY "Users can insert their own connections."
ON connections FOR INSERT
WITH CHECK ( auth.uid() = follower_id );

CREATE POLICY "Users can delete their own connections."
ON connections FOR DELETE
USING ( auth.uid() = follower_id );
