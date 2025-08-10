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
    const [exercises, setExercises] = useState<any[]>([]);
    const [currentSession, setCurrentSession] = useState<WorkoutSession | null>(null);

    // Load exercises from database
    useEffect(() => {
        loadExercises();
    }, []);

    const loadExercises = async () => {
        try {
            const { data, error } = await supabase
                .from('exercises')
                .select('*')
                .order('name');

            if (error) throw error;
            setExercises(data || []);
        } catch (error) {
            console.error('Error loading exercises:', error);
        }
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
    };

    return {
        loading,
        exercises,
        currentSession,
        createFreeformSession,
        addExerciseToSession,
        updateExercise,
        removeExerciseFromSession,
        saveSession,
        clearSession,
        loadExercises
    };
}
