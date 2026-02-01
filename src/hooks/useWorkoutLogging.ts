import { useState, useEffect, useRef } from 'react';
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

/** Day exercise shape for pre-filling from a program day */
export type ProgramDayExercise = {
    exercise_id: string;
    exercise_name: string;
    sets: number;
    reps: number[];
};

const SESSION_STORAGE_KEY = 'hfdd_workout_in_progress';

function readStoredSession(): WorkoutSession | null {
    if (typeof window === 'undefined') return null;
    try {
        const stored = sessionStorage.getItem(SESSION_STORAGE_KEY);
        if (!stored) return null;
        const parsed = JSON.parse(stored) as WorkoutSession;
        // Allow temp IDs (unsaved sessions) or real IDs
        if (!parsed?.user_id || !Array.isArray(parsed.exercises)) return null;
        return parsed;
    } catch {
        return null;
    }
}

function writeStoredSession(session: WorkoutSession | null, userId: string | undefined): void {
    if (typeof window === 'undefined') return;
    if (session && userId && session.user_id === userId) {
        sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
    } else {
        sessionStorage.removeItem(SESSION_STORAGE_KEY);
    }
}

export function useWorkoutLogging() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [currentSession, setCurrentSession] = useState<WorkoutSession | null>(readStoredSession);
    const [existingSession, setExistingSession] = useState<WorkoutSession | null>(null);
    const isEditingRef = useRef(false);

    // Persist whenever currentSession changes (backup; we also persist in each setter below)
    useEffect(() => {
        writeStoredSession(currentSession, user?.id);
    }, [currentSession, user?.id]);

    // On mount: validate restored session belongs to current user; else check for existing freeform session today
    useEffect(() => {
        if (!user) return;
        const stored = readStoredSession();
        if (stored) {
            if (stored.user_id === user.id) {
                setCurrentSession(stored);
                setExistingSession(null);
                return;
            }
            setCurrentSession(null);
            sessionStorage.removeItem(SESSION_STORAGE_KEY);
        }
        checkForExistingSession();
    }, [user]);

    const checkForExistingSession = async () => {
        if (!user || isEditingRef.current) return;

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
                    sets: log.sets_completed,
                    reps: typeof log.reps_per_set === 'string' ? JSON.parse(log.reps_per_set) : log.reps_per_set,
                    weight: log.weight_per_set && log.weight_per_set.length > 0 ? log.weight_per_set[0] : null,
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
        isEditingRef.current = true;
        setCurrentSession(session);
        setExistingSession(null);
    };

    const createFreeformSession = (sessionName: string): string => {
        if (!user) throw new Error('User not authenticated');

        // Create session in memory only (saved to DB on "Finish Workout")
        const tempId = `temp-${Date.now()}`;
        const newSession: WorkoutSession = {
            id: tempId,
            user_id: user.id,
            session_type: 'freeform',
            session_name: sessionName,
            session_date: new Date().toISOString().split('T')[0],
            exercises: []
        };

        setCurrentSession(newSession);
        setExistingSession(null);
        return tempId;
    };

    const createProgramSession = (
        programId: string,
        programName: string,
        weekNumber: number,
        dayName: string,
        dayExercises: ProgramDayExercise[]
    ): string => {
        if (!user) throw new Error('User not authenticated');

        // Create session in memory only (saved to DB on "Finish Workout")
        const tempId = `temp-${Date.now()}`;
        const sessionName = `${programName} – Week ${weekNumber} – ${dayName}`;
        const sessionDate = new Date().toISOString().split('T')[0];

        const exercises: WorkoutExercise[] = dayExercises.map((ex, index) => ({
            id: `temp-ex-${Date.now()}-${index}`,
            exercise_id: ex.exercise_id,
            exercise_name: ex.exercise_name,
            sets: ex.sets,
            reps: ex.reps?.length ? ex.reps : [10, 10, 10],
            weight: undefined,
            notes: undefined
        }));

        const newSession: WorkoutSession = {
            id: tempId,
            user_id: user.id,
            session_type: 'program',
            session_name: sessionName,
            program_id: programId,
            week_number: weekNumber,
            day_name: dayName,
            session_date: sessionDate,
            exercises
        };

        setCurrentSession(newSession);
        setExistingSession(null);
        return tempId;
    };

    const addExerciseToSession = (exerciseId: string, exerciseName: string, sets: number, reps: number[], weight?: number, notes?: string) => {
        if (!currentSession) throw new Error('No active session');

        const newExercise: WorkoutExercise = {
            id: `temp-ex-${Date.now()}`,
            exercise_id: exerciseId,
            exercise_name: exerciseName,
            sets,
            reps,
            weight,
            notes
        };

        // Update local state only (saved to DB on "Finish Workout")
        setCurrentSession(prev => prev ? {
            ...prev,
            exercises: [...prev.exercises, newExercise]
        } : null);
    };

    const updateExercise = (entryId: string, updates: Partial<WorkoutExercise>) => {
        if (!currentSession) throw new Error('No active session');

        // Update local state only (saved to DB on "Finish Workout")
        // Match by the unique entry ID, not exercise_id (allows multiple of same exercise)
        setCurrentSession(prev => prev ? {
            ...prev,
            exercises: prev.exercises.map(ex =>
                ex.id === entryId
                    ? { ...ex, ...updates }
                    : ex
            )
        } : null);
    };

    const removeExerciseFromSession = (entryId: string) => {
        if (!currentSession) throw new Error('No active session');

        // Update local state only (saved to DB on "Finish Workout")
        // Match by the unique entry ID, not exercise_id (allows multiple of same exercise)
        setCurrentSession(prev => prev ? {
            ...prev,
            exercises: prev.exercises.filter(ex => ex.id !== entryId)
        } : null);
    };

    const saveSession = async (): Promise<string> => {
        if (!currentSession || !user) throw new Error('No active session');

        setLoading(true);
        try {
            // Check if this is a new session (temp ID) or existing one being edited
            const isNewSession = currentSession.id?.startsWith('temp-');

            if (isNewSession) {
                // Insert session to database
                const { data: sessionData, error: sessionError } = await supabase
                    .from('workout_sessions')
                    .insert({
                        user_id: user.id,
                        session_type: currentSession.session_type,
                        session_name: currentSession.session_name,
                        session_date: currentSession.session_date,
                        program_id: currentSession.program_id || null,
                        week_number: currentSession.week_number || null,
                        day_name: currentSession.day_name || null
                    })
                    .select()
                    .single();

                if (sessionError) throw sessionError;

                // Insert all exercises
                if (currentSession.exercises.length > 0) {
                    const logsToInsert = currentSession.exercises.map((ex, index) => ({
                        session_id: sessionData.id,
                        exercise_id: ex.exercise_id,
                        exercise_name: ex.exercise_name,
                        sets_completed: ex.sets,
                        reps_per_set: ex.reps,
                        weight_per_set: ex.weight ? [ex.weight] : [],
                        notes: ex.notes || null,
                        exercise_order: index + 1
                    }));

                    const { error: logsError } = await supabase
                        .from('workout_logs')
                        .insert(logsToInsert);

                    if (logsError) throw logsError;
                }

                return sessionData.id;
            } else {
                // Editing existing session - update exercises
                const sessionId = currentSession.id!;

                // Delete old exercises and insert new ones
                await supabase
                    .from('workout_logs')
                    .delete()
                    .eq('session_id', sessionId);

                if (currentSession.exercises.length > 0) {
                    const logsToInsert = currentSession.exercises.map((ex, index) => ({
                        session_id: sessionId,
                        exercise_id: ex.exercise_id,
                        exercise_name: ex.exercise_name,
                        sets_completed: ex.sets,
                        reps_per_set: ex.reps,
                        weight_per_set: ex.weight ? [ex.weight] : [],
                        notes: ex.notes || null,
                        exercise_order: index + 1
                    }));

                    const { error: logsError } = await supabase
                        .from('workout_logs')
                        .insert(logsToInsert);

                    if (logsError) throw logsError;
                }

                return sessionId;
            }
        } catch (error) {
            console.error('Error saving session:', error);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const clearSession = () => {
        setCurrentSession(null);
        setExistingSession(null);
        isEditingRef.current = false;
        if (typeof window !== 'undefined') {
            sessionStorage.removeItem(SESSION_STORAGE_KEY);
        }
    };

    return {
        loading,
        currentSession,
        existingSession,
        createFreeformSession,
        createProgramSession,
        continueExistingSession,
        addExerciseToSession,
        updateExercise,
        removeExerciseFromSession,
        saveSession,
        clearSession,
        checkForExistingSession
    };
}
