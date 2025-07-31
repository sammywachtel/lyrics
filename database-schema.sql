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
    prosody_config JSONB DEFAULT '{}',
    is_archived BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Song versions table for version history
CREATE TABLE song_versions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    song_id UUID NOT NULL REFERENCES songs(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    title TEXT NOT NULL,
    content TEXT DEFAULT '',
    metadata JSONB DEFAULT '{}',
    settings JSONB DEFAULT '{}',
    prosody_config JSONB DEFAULT '{}',
    change_summary TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Song settings history table for change tracking
CREATE TABLE song_settings_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    song_id UUID NOT NULL REFERENCES songs(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    settings_before JSONB DEFAULT '{}',
    settings_after JSONB DEFAULT '{}',
    prosody_config_before JSONB DEFAULT '{}',
    prosody_config_after JSONB DEFAULT '{}',
    changed_fields JSONB DEFAULT '[]',
    change_type VARCHAR(50) DEFAULT 'manual',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Row Level Security (RLS) policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE songs ENABLE ROW LEVEL SECURITY;
ALTER TABLE song_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE song_settings_history ENABLE ROW LEVEL SECURITY;
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

-- Song versions policies
CREATE POLICY "Users can view own song versions" ON song_versions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own song versions" ON song_versions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own song versions" ON song_versions
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own song versions" ON song_versions
    FOR DELETE USING (auth.uid() = user_id);

-- Song settings history policies
CREATE POLICY "Users can view own settings history" ON song_settings_history
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own settings history" ON song_settings_history
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own settings history" ON song_settings_history
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own settings history" ON song_settings_history
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

-- Song versions indexes
CREATE INDEX idx_song_versions_song_id ON song_versions(song_id);
CREATE INDEX idx_song_versions_user_id ON song_versions(user_id);
CREATE INDEX idx_song_versions_created_at ON song_versions(created_at);
CREATE INDEX idx_song_versions_version_number ON song_versions(song_id, version_number);

-- Settings history indexes
CREATE INDEX idx_settings_history_song_id ON song_settings_history(song_id);
CREATE INDEX idx_settings_history_user_id ON song_settings_history(user_id);
CREATE INDEX idx_settings_history_created_at ON song_settings_history(created_at);
CREATE INDEX idx_settings_history_change_type ON song_settings_history(change_type);

-- Additional performance indexes for settings queries
CREATE INDEX idx_songs_settings_gin ON songs USING GIN (settings);
CREATE INDEX idx_songs_prosody_gin ON songs USING GIN (prosody_config);

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

-- Unique constraints for version numbering
ALTER TABLE song_versions ADD CONSTRAINT unique_song_version UNIQUE (song_id, version_number);

-- Function to automatically create song version on major changes
CREATE OR REPLACE FUNCTION create_song_version_on_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Create version if title or content changed significantly
    IF (OLD.title != NEW.title OR 
        LENGTH(OLD.content) != LENGTH(NEW.content) OR 
        OLD.content != NEW.content) THEN
        
        INSERT INTO song_versions (
            song_id, user_id, version_number, title, content, 
            metadata, settings, prosody_config, change_summary
        )
        SELECT 
            OLD.id,
            OLD.user_id,
            COALESCE(
                (SELECT MAX(version_number) + 1 
                 FROM song_versions 
                 WHERE song_id = OLD.id), 
                1
            ),
            OLD.title,
            OLD.content,
            OLD.metadata,
            OLD.settings,
            OLD.prosody_config,
            CASE 
                WHEN OLD.title != NEW.title THEN 'Title changed'
                WHEN OLD.content != NEW.content THEN 'Content updated'
                ELSE 'Song updated'
            END;
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to create versions on major song changes
CREATE TRIGGER create_song_version_trigger
    BEFORE UPDATE ON songs
    FOR EACH ROW
    EXECUTE FUNCTION create_song_version_on_change();

-- Function to track settings changes
CREATE OR REPLACE FUNCTION track_settings_changes()
RETURNS TRIGGER AS $$
BEGIN
    -- Track settings changes if they're different
    IF (OLD.settings != NEW.settings OR OLD.prosody_config != NEW.prosody_config) THEN
        INSERT INTO song_settings_history (
            song_id, user_id, settings_before, settings_after,
            prosody_config_before, prosody_config_after, change_type
        )
        VALUES (
            NEW.id,
            NEW.user_id,
            OLD.settings,
            NEW.settings,
            OLD.prosody_config,
            NEW.prosody_config,
            'manual'
        );
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to track settings changes
CREATE TRIGGER track_settings_changes_trigger
    AFTER UPDATE ON songs
    FOR EACH ROW
    EXECUTE FUNCTION track_settings_changes();