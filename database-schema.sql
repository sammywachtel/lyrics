-- Songwriting App Database Schema
-- Migration for existing installations: Add settings column if it doesn't exist
-- ALTER TABLE songs ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{}';

-- drop table test_records;
-- drop table users;
-- drop table songs;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Test records table for infrastructure testing
CREATE TABLE test_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    message TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Users table (extends Supabase auth.users)
CREATE TABLE users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    display_name TEXT,
    subscription_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Songs table
CREATE TABLE songs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT DEFAULT '',
    metadata JSONB DEFAULT '{}',
    settings JSONB DEFAULT '{}',
    is_archived BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Row Level Security (RLS) policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE songs ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_records ENABLE ROW LEVEL SECURITY;

-- Users can only see/edit their own data
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON users
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

-- Songs policies
CREATE POLICY "Users can view own songs" ON songs
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own songs" ON songs
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own songs" ON songs
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own songs" ON songs
    FOR DELETE USING (auth.uid() = user_id);

-- Test records - allow all for testing (remove in production)
CREATE POLICY "Allow all test records" ON test_records
    FOR ALL USING (true);

-- Indexes for performance
CREATE INDEX idx_songs_user_id ON songs(user_id);
CREATE INDEX idx_songs_created_at ON songs(created_at);
CREATE INDEX idx_songs_title ON songs(title);
CREATE INDEX idx_songs_archived ON songs(is_archived);
CREATE INDEX idx_songs_settings_genre ON songs USING GIN ((settings->'style_guide'->'primary_genre'));
CREATE INDEX idx_songs_settings_pov ON songs USING GIN ((settings->'narrative_pov'));
CREATE INDEX idx_songs_settings_energy ON songs USING GIN ((settings->'energy_level'));

-- Update timestamp trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply update timestamp triggers
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_songs_updated_at
    BEFORE UPDATE ON songs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();