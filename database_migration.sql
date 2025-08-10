-- Migration script to add missing columns to existing tables
-- Run this if you already have some tables created

-- Add is_public column to workout_programs if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'workout_programs' 
        AND column_name = 'is_public'
    ) THEN
        ALTER TABLE workout_programs ADD COLUMN is_public BOOLEAN DEFAULT false;
    END IF;
END $$;

-- Create user_programs table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_programs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    program_id UUID REFERENCES workout_programs(id) ON DELETE CASCADE,
    is_owner BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, program_id)
);

-- Create workout_sessions table if it doesn't exist
CREATE TABLE IF NOT EXISTS workout_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    program_id UUID REFERENCES workout_programs(id) ON DELETE CASCADE,
    week_number INTEGER NOT NULL,
    day_name TEXT NOT NULL,
    session_date DATE NOT NULL,
    start_time TIMESTAMP WITH TIME ZONE,
    end_time TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    rating INTEGER CHECK (rating >= 1 AND rating <= 10),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create workout_logs table if it doesn't exist
CREATE TABLE IF NOT EXISTS workout_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID REFERENCES workout_sessions(id) ON DELETE CASCADE,
    exercise_id UUID REFERENCES exercises(id) ON DELETE CASCADE,
    exercise_name TEXT NOT NULL,
    sets_completed INTEGER NOT NULL DEFAULT 0,
    reps_per_set JSONB NOT NULL DEFAULT '[]'::jsonb,
    weight_per_set JSONB DEFAULT '[]'::jsonb,
    rest_time INTEGER,
    notes TEXT,
    exercise_order INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add missing indexes
CREATE INDEX IF NOT EXISTS idx_workout_programs_public ON workout_programs(is_public);
CREATE INDEX IF NOT EXISTS idx_user_programs_user_id ON user_programs(user_id);
CREATE INDEX IF NOT EXISTS idx_user_programs_program_id ON user_programs(program_id);
CREATE INDEX IF NOT EXISTS idx_workout_sessions_user_id ON workout_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_workout_sessions_program_id ON workout_sessions(program_id);
CREATE INDEX IF NOT EXISTS idx_workout_sessions_date ON workout_sessions(session_date);
CREATE INDEX IF NOT EXISTS idx_workout_logs_session_id ON workout_logs(session_id);

-- Enable RLS on new tables
ALTER TABLE user_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user_programs
CREATE POLICY "Users can view their program associations" ON user_programs
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own program associations" ON user_programs
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own program associations" ON user_programs
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own program associations" ON user_programs
    FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for workout_sessions
CREATE POLICY "Users can view their own workout sessions" ON workout_sessions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own workout sessions" ON workout_sessions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own workout sessions" ON workout_sessions
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own workout sessions" ON workout_sessions
    FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for workout_logs
CREATE POLICY "Users can view their own workout logs" ON workout_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM workout_sessions s
            WHERE s.id = workout_logs.session_id
            AND s.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert their own workout logs" ON workout_logs
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM workout_sessions s
            WHERE s.id = workout_logs.session_id
            AND s.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update their own workout logs" ON workout_logs
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM workout_sessions s
            WHERE s.id = workout_logs.session_id
            AND s.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete their own workout logs" ON workout_logs
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM workout_sessions s
            WHERE s.id = workout_logs.session_id
            AND s.user_id = auth.uid()
        )
    );

-- Update RLS policies to include the new is_public column
DROP POLICY IF EXISTS "Users can view their own and public workout programs" ON workout_programs;
CREATE POLICY "Users can view their own and public workout programs" ON workout_programs
    FOR SELECT USING (
        auth.uid() = user_id OR is_public = true
    );

-- Create function to automatically add user to their own program
CREATE OR REPLACE FUNCTION add_user_to_program()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO user_programs (user_id, program_id, is_owner)
    VALUES (NEW.user_id, NEW.id, true);
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically add user to their own program
DROP TRIGGER IF EXISTS add_user_to_own_program ON workout_programs;
CREATE TRIGGER add_user_to_own_program
    AFTER INSERT ON workout_programs
    FOR EACH ROW EXECUTE FUNCTION add_user_to_program(); 