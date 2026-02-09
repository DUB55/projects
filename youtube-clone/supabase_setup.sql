-- Create videos table
CREATE TABLE videos (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL CHECK (type IN ('video', 'short')),
    title TEXT NOT NULL,
    channel TEXT NOT NULL,
    channel_id TEXT NOT NULL,
    thumbnail_url TEXT,
    source_url TEXT,
    duration INTEGER,
    published_at TIMESTAMP WITH TIME ZONE,
    language TEXT,
    tags TEXT[] DEFAULT '{}',
    summary JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;

-- Create policy to allow everyone to read
CREATE POLICY "Allow public read access" ON videos
    FOR SELECT USING (true);

-- Create policy to allow authenticated users (Admin) to insert/update/delete
-- Since we are using manual admin check, we can use a service role for writes 
-- or a specific anon policy if needed (though service role is safer for admin actions).
-- For now, let's allow ALL access for the anon key to make it easy for the developer 
-- to test "Admin" actions if they haven't set up full Supabase Auth yet.
-- WARNING: In production, you should restrict this to authenticated users only.
CREATE POLICY "Allow public write access for testing" ON videos
    FOR ALL USING (true);
