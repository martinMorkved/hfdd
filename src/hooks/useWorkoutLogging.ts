import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export interface WorkoutExercise {
    id: string;
    exercise_id: string;
    exercise_name: string;
    sets: number;
    reps: number[];
    weight?: number;
    notes?: string;
}

export interface WorkoutSession {
    id?: string;
    user_id: string;
    session_type: 'program' | 'freeform';
    session_name?: string;
    program_id?: string;
    week_number?: number;
    day_name?: string;
    session_date: string;
    exercises: WorkoutExercise[];
}

export function useWorkoutLogging() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [currentSession, setCurrentSession] = useState<WorkoutSession | null>(null);
    const [existingSession, setExistingSession] = useState<WorkoutSession | null>(null);

    // Check for existing session from today when component mounts
    useEffect(() => {
        if (user) {
            checkForExistingSession();
        }
    }, [user]);

    const checkForExistingSession = async () => {
        if (!user) return;

        try {
            const today = new Date().toISOString().split('T')[0];
            const { data, error } = await supabase
                .from('workout_sessions')
                .select('*')
                .eq('user_id', user.id)
                .eq('session_date', today)
                .eq('session_type', 'freeform')
                .order('created_at', { ascending: false })
                .limit(1);

            if (error) throw error;

            if (data && data.length > 0) {
                const session = data[0];
                // Load exercises for this session
                const { data: logsData, error: logsError } = await supabase
                    .from('workout_logs')
                    .select('*')
                    .eq('session_id', session.id)
                    .order('exercise_order', { ascending: true });

                if (logsError) throw logsError;

                const exercises = (logsData || []).map(log => ({
                    id: log.id,
                    exercise_id: log.exercise_id,
                    exercise_name: log.exercise_name,
                    sets: log.sets,
                    reps: typeof log.reps === 'string' ? JSON.parse(log.reps) : log.reps,
                    weight: log.weight,
                    notes: log.notes
                }));

                const existingSessionWithExercises: WorkoutSession = {
                    id: session.id,
                    user_id: session.user_id,
                    session_type: session.session_type,
                    session_name: session.session_name,
                    session_date: session.session_date,
                    exercises
                };

                setExistingSession(existingSessionWithExercises);
            }
        } catch (error) {
            console.error('Error checking for existing session:', error);
        }
    };

    const continueExistingSession = async (session: WorkoutSession) => {
        setCurrentSession(session);
        setExistingSession(null);
    };

    const createFreeformSession = async (sessionName: string): Promise<string> => {
        if (!user) throw new Error('User not authenticated');

        try {
            setLoading(true);

            const { data, error } = await supabase
                .from('workout_sessions')
                .insert({
                    user_id: user.id,
                    session_type: 'freeform',
                    session_name: sessionName,
                    session_date: new Date().toISOString().split('T')[0],
                    program_id: null,
                    week_number: null,
                    day_name: null
                })
                .select()
                .single();

            if (error) throw error;

            const newSession: WorkoutSession = {
                id: data.id,
                user_id: user.id,
                session_type: 'freeform',
                session_name: sessionName,
                session_date: data.session_date,
                exercises: []
            };

            setCurrentSession(newSession);
            setExistingSession(null);
            return data.id;
        } catch (error) {
            console.error('Error creating session:', error);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const addExerciseToSession = async (exerciseId: string, exerciseName: string, sets: number, reps: number[], weight?: number, notes?: string) => {
        if (!currentSession?.id) throw new Error('No active session');

        try {
            setLoading(true);

            const newExercise: WorkoutExercise = {
                id: Date.now().toString(),
                exercise_id: exerciseId,
                exercise_name: exerciseName,
                sets,
                reps,
                weight,
                notes
            };

            // Add to database
            const { error } = await supabase
                .from('workout_logs')
                .insert({
                    session_id: currentSession.id,
                    exercise_id: exerciseId,
                    exercise_name: exerciseName,
                    sets,
                    reps: JSON.stringify(reps),
                    weight,
                    notes,
                    set_order: (currentSession.exercises.length + 1),
                    exercise_order: (currentSession.exercises.length + 1)
                });

            if (error) throw error;

            // Update local state
            setCurrentSession(prev => prev ? {
                ...prev,
                exercises: [...prev.exercises, newExercise]
            } : null);

        } catch (error) {
            console.error('Error adding exercise:', error);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const updateExercise = async (exerciseId: string, updates: Partial<WorkoutExercise>) => {
        if (!currentSession?.id) throw new Error('No active session');

        try {
            setLoading(true);

            const { error } = await supabase
                .from('workout_logs')
                .update({
                    sets: updates.sets,
                    reps: updates.reps ? JSON.stringify(updates.reps) : undefined,
                    weight: updates.weight,
                    notes: updates.notes
                })
                .eq('session_id', currentSession.id)
                .eq('exercise_id', exerciseId);

            if (error) throw error;

            // Update local state
            setCurrentSession(prev => prev ? {
                ...prev,
                exercises: prev.exercises.map(ex =>
                    ex.exercise_id === exerciseId
                        ? { ...ex, ...updates }
                        : ex
                )
            } : null);

        } catch (error) {
            console.error('Error updating exercise:', error);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const removeExerciseFromSession = async (exerciseId: string) => {
        if (!currentSession?.id) throw new Error('No active session');

        try {
            setLoading(true);

            const { error } = await supabase
                .from('workout_logs')
                .delete()
                .eq('session_id', currentSession.id)
                .eq('exercise_id', exerciseId);

            if (error) throw error;

            // Update local state
            setCurrentSession(prev => prev ? {
                ...prev,
                exercises: prev.exercises.filter(ex => ex.exercise_id !== exerciseId)
            } : null);

        } catch (error) {
            console.error('Error removing exercise:', error);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const saveSession = async () => {
        if (!currentSession?.id) throw new Error('No active session');

        // Session is already saved as we add exercises
        // This could be used for final validation or additional processing
        console.log('Session saved successfully:', currentSession);
        return currentSession.id;
    };

    const clearSession = () => {
        setCurrentSession(null);
        setExistingSession(null);
    };

    return {
        loading,
        currentSession,
        existingSession,
        createFreeformSession,
        continueExistingSession,
        addExerciseToSession,
        updateExercise,
        removeExerciseFromSession,
        saveSession,
        clearSession,
        checkForExistingSession
    };
}
