-- Create site_settings table
CREATE TABLE IF NOT EXISTS site_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Initial data for mock settings
INSERT INTO site_settings (key, value)
VALUES ('showMockData', 'true'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- RLS Policies
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

-- Allow everyone to read settings
CREATE POLICY "Allow public read access" ON site_settings
    FOR SELECT USING (true);

-- Allow admins (everyone for now) to upsert settings
-- Upsert requires both INSERT and UPDATE permissions
CREATE POLICY "Allow upsert for all" ON site_settings
    FOR ALL USING (true);
