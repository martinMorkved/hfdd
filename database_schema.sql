-- Enhanced Workout Programs Database Schema
-- Supports program creation, sharing, and workout logging

-- Note: auth.users table is managed by Supabase Auth and already has RLS enabled

-- Create workout_programs table
CREATE TABLE IF NOT EXISTS workout_programs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    structure TEXT NOT NULL CHECK (structure IN ('weekly', 'rotating', 'block', 'frequency')),
    is_public BOOLEAN DEFAULT false, -- Allow sharing with other users
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create workout_weeks table
CREATE TABLE IF NOT EXISTS workout_weeks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    program_id UUID REFERENCES workout_programs(id) ON DELETE CASCADE,
    week_number INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create workout_days table
CREATE TABLE IF NOT EXISTS workout_days (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    week_id UUID REFERENCES workout_weeks(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    day_order INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create workout_exercises table
CREATE TABLE IF NOT EXISTS workout_exercises (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    day_id UUID REFERENCES workout_days(id) ON DELETE CASCADE,
    exercise_id UUID REFERENCES exercises(id) ON DELETE CASCADE,
    exercise_name TEXT NOT NULL,
    sets INTEGER NOT NULL DEFAULT 1,
    reps JSONB NOT NULL DEFAULT '[]'::jsonb,
    comment TEXT,
    alternatives JSONB DEFAULT '[]'::jsonb,
    exercise_order INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_programs table (for program sharing)
CREATE TABLE IF NOT EXISTS user_programs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    program_id UUID REFERENCES workout_programs(id) ON DELETE CASCADE,
    is_owner BOOLEAN DEFAULT false, -- True if user created the program
    is_active BOOLEAN DEFAULT true, -- User can deactivate programs
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, program_id)
);

-- Create workout_sessions table (for logging actual workouts)
CREATE TABLE IF NOT EXISTS workout_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    program_id UUID REFERENCES workout_programs(id) ON DELETE CASCADE,
    week_number INTEGER NOT NULL,
    day_name TEXT NOT NULL, -- "Monday", "Day A", etc.
    session_date DATE NOT NULL,
    start_time TIMESTAMP WITH TIME ZONE,
    end_time TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    rating INTEGER CHECK (rating >= 1 AND rating <= 10), -- How the workout felt
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create workout_logs table (for individual exercise performance)
CREATE TABLE IF NOT EXISTS workout_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID REFERENCES workout_sessions(id) ON DELETE CASCADE,
    exercise_id UUID REFERENCES exercises(id) ON DELETE CASCADE,
    exercise_name TEXT NOT NULL,
    sets_completed INTEGER NOT NULL DEFAULT 0,
    reps_per_set JSONB NOT NULL DEFAULT '[]'::jsonb, -- [10, 8, 6] for 3 sets
    weight_per_set JSONB DEFAULT '[]'::jsonb, -- [100, 95, 90] in kg/lbs
    rest_time INTEGER, -- Rest time in seconds
    notes TEXT,
    exercise_order INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_workout_programs_user_id ON workout_programs(user_id);
CREATE INDEX IF NOT EXISTS idx_workout_programs_public ON workout_programs(is_public);
CREATE INDEX IF NOT EXISTS idx_workout_weeks_program_id ON workout_weeks(program_id);
CREATE INDEX IF NOT EXISTS idx_workout_days_week_id ON workout_days(week_id);
CREATE INDEX IF NOT EXISTS idx_workout_exercises_day_id ON workout_exercises(day_id);
CREATE INDEX IF NOT EXISTS idx_user_programs_user_id ON user_programs(user_id);
CREATE INDEX IF NOT EXISTS idx_user_programs_program_id ON user_programs(program_id);
CREATE INDEX IF NOT EXISTS idx_workout_sessions_user_id ON workout_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_workout_sessions_program_id ON workout_sessions(program_id);
CREATE INDEX IF NOT EXISTS idx_workout_sessions_date ON workout_sessions(session_date);
CREATE INDEX IF NOT EXISTS idx_workout_logs_session_id ON workout_logs(session_id);

-- Enable Row Level Security on all tables
ALTER TABLE workout_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_weeks ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for workout_programs
CREATE POLICY "Users can view their own and public workout programs" ON workout_programs
    FOR SELECT USING (
        auth.uid() = user_id OR is_public = true
    );

CREATE POLICY "Users can insert their own workout programs" ON workout_programs
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own workout programs" ON workout_programs
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own workout programs" ON workout_programs
    FOR DELETE USING (auth.uid() = user_id);

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

-- Create RLS policies for workout_weeks (updated to allow access to shared programs)
CREATE POLICY "Users can view workout weeks of their accessible programs" ON workout_weeks
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM workout_programs p
            JOIN user_programs up ON up.program_id = p.id
            WHERE p.id = workout_weeks.program_id 
            AND up.user_id = auth.uid()
            AND up.is_active = true
        )
    );

CREATE POLICY "Users can insert workout weeks to their own programs" ON workout_weeks
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM workout_programs p
            WHERE p.id = workout_weeks.program_id 
            AND p.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update workout weeks of their own programs" ON workout_weeks
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM workout_programs p
            WHERE p.id = workout_weeks.program_id 
            AND p.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete workout weeks of their own programs" ON workout_weeks
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM workout_programs p
            WHERE p.id = workout_weeks.program_id 
            AND p.user_id = auth.uid()
        )
    );

-- Create RLS policies for workout_days (updated to allow access to shared programs)
CREATE POLICY "Users can view workout days of their accessible programs" ON workout_days
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM workout_weeks w
            JOIN workout_programs p ON p.id = w.program_id
            JOIN user_programs up ON up.program_id = p.id
            WHERE w.id = workout_days.week_id 
            AND up.user_id = auth.uid()
            AND up.is_active = true
        )
    );

CREATE POLICY "Users can insert workout days to their own programs" ON workout_days
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM workout_weeks w
            JOIN workout_programs p ON p.id = w.program_id
            WHERE w.id = workout_days.week_id 
            AND p.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update workout days of their own programs" ON workout_days
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM workout_weeks w
            JOIN workout_programs p ON p.id = w.program_id
            WHERE w.id = workout_days.week_id 
            AND p.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete workout days of their own programs" ON workout_days
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM workout_weeks w
            JOIN workout_programs p ON p.id = w.program_id
            WHERE w.id = workout_days.week_id 
            AND p.user_id = auth.uid()
        )
    );

-- Create RLS policies for workout_exercises (updated to allow access to shared programs)
CREATE POLICY "Users can view workout exercises of their accessible programs" ON workout_exercises
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM workout_days d
            JOIN workout_weeks w ON w.id = d.week_id
            JOIN workout_programs p ON p.id = w.program_id
            JOIN user_programs up ON up.program_id = p.id
            WHERE d.id = workout_exercises.day_id 
            AND up.user_id = auth.uid()
            AND up.is_active = true
        )
    );

CREATE POLICY "Users can insert workout exercises to their own programs" ON workout_exercises
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM workout_days d
            JOIN workout_weeks w ON w.id = d.week_id
            JOIN workout_programs p ON p.id = w.program_id
            WHERE d.id = workout_exercises.day_id 
            AND p.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update workout exercises of their own programs" ON workout_exercises
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM workout_days d
            JOIN workout_weeks w ON w.id = d.week_id
            JOIN workout_programs p ON p.id = w.program_id
            WHERE d.id = workout_exercises.day_id 
            AND p.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete workout exercises of their own programs" ON workout_exercises
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM workout_days d
            JOIN workout_weeks w ON w.id = d.week_id
            JOIN workout_programs p ON p.id = w.program_id
            WHERE d.id = workout_exercises.day_id 
            AND p.user_id = auth.uid()
        )
    );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_workout_programs_updated_at 
    BEFORE UPDATE ON workout_programs 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workout_exercises_updated_at 
    BEFORE UPDATE ON workout_exercises 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workout_sessions_updated_at 
    BEFORE UPDATE ON workout_sessions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

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
CREATE TRIGGER add_user_to_own_program
    AFTER INSERT ON workout_programs
    FOR EACH ROW EXECUTE FUNCTION add_user_to_program(); 