import { createClient } from '@supabase/supabase-js'

// Get environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables. Please check your .env file.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types (we'll define these based on our schema)
export type Database = {
    public: {
        Tables: {
            users: {
                Row: {
                    id: string
                    email: string
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    email: string
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    email?: string
                    created_at?: string
                    updated_at?: string
                }
            }
            workout_programs: {
                Row: {
                    id: string
                    user_id: string
                    name: string
                    description: string | null
                    structure: 'weekly' | 'rotating' | 'block' | 'frequency'
                    is_public: boolean
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    name: string
                    description?: string | null
                    structure: 'weekly' | 'rotating' | 'block' | 'frequency'
                    is_public?: boolean
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    name?: string
                    description?: string | null
                    structure?: 'weekly' | 'rotating' | 'block' | 'frequency'
                    is_public?: boolean
                    created_at?: string
                    updated_at?: string
                }
            }
            exercises: {
                Row: {
                    id: string
                    user_id: string | null
                    name: string
                    description: string | null
                    muscle_group: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    user_id?: string | null
                    name: string
                    description?: string | null
                    muscle_group?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string | null
                    name?: string
                    description?: string | null
                    muscle_group?: string | null
                    created_at?: string
                    updated_at?: string
                }
            }
            workout_sessions: {
                Row: {
                    id: string
                    user_id: string
                    program_id: string | null
                    session_type: 'program' | 'freeform'
                    session_name: string | null
                    week_number: number | null
                    day_name: string | null
                    session_date: string
                    start_time: string | null
                    end_time: string | null
                    notes: string | null
                    rating: number | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    program_id?: string | null
                    session_type: 'program' | 'freeform'
                    session_name?: string | null
                    week_number?: number | null
                    day_name?: string | null
                    session_date: string
                    start_time?: string | null
                    end_time?: string | null
                    notes?: string | null
                    rating?: number | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    program_id?: string | null
                    session_type?: 'program' | 'freeform'
                    session_name?: string | null
                    week_number?: number | null
                    day_name?: string | null
                    session_date?: string
                    start_time?: string | null
                    end_time?: string | null
                    notes?: string | null
                    rating?: number | null
                    created_at?: string
                    updated_at?: string
                }
            }
            workout_logs: {
                Row: {
                    id: string
                    session_id: string
                    exercise_id: string
                    exercise_name: string
                    sets_completed: number
                    reps_per_set: any
                    weight_per_set: any
                    rest_time: number | null
                    notes: string | null
                    exercise_order: number
                    created_at: string
                }
                Insert: {
                    id?: string
                    session_id: string
                    exercise_id: string
                    exercise_name: string
                    sets_completed?: number
                    reps_per_set?: any
                    weight_per_set?: any
                    rest_time?: number | null
                    notes?: string | null
                    exercise_order: number
                    created_at?: string
                }
                Update: {
                    id?: string
                    session_id?: string
                    exercise_id?: string
                    exercise_name?: string
                    sets_completed?: number
                    reps_per_set?: any
                    weight_per_set?: any
                    rest_time?: number | null
                    notes?: string | null
                    exercise_order?: number
                    created_at?: string
                }
            }
            user_active_program: {
                Row: {
                    id: string
                    user_id: string
                    program_id: string
                    activated_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    program_id: string
                    activated_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    program_id?: string
                    activated_at?: string
                }
            }
        }
    }
} 