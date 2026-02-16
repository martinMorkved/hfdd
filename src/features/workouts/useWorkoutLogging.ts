import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

export interface WorkoutExercise {
    id: string;
    exercise_id: string;
    exercise_name: string;
    sets: number;
    reps: number[];
    /** Default weight (kg) for all sets; one input in UI; 0 = bodyweight */
    weight?: number;
    /** Override weight (kg) for specific set index; undefined = use default weight */
    weight_per_set?: (number | undefined)[];
    notes?: string;
    alternatives?: string[];
    original_exercise_id?: string;
    original_exercise_name?: string;
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
    alternatives?: string[];
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

                const exercises = (logsData || []).map(log => {
                    const reps = typeof log.reps_per_set === 'string' ? JSON.parse(log.reps_per_set) : log.reps_per_set;
                    const wp = Array.isArray(log.weight_per_set) ? log.weight_per_set : [];
                    const full = reps?.length ? [...wp].slice(0, reps.length) : [];
                    const defaultW = full[0] ?? 0;
                    const overrides = full.map(w => (w !== defaultW ? w : undefined));
                    return {
                        id: log.id,
                        exercise_id: log.exercise_id,
                        exercise_name: log.exercise_name,
                        sets: log.sets_completed,
                        reps,
                        weight: defaultW,
                        weight_per_set: overrides.some(x => x !== undefined) ? overrides : undefined,
                        notes: log.notes
                    };
                });

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
        weekNumber: number,
        dayName: string,
        dayExercises: ProgramDayExercise[],
        totalWeeks?: number,
        programStructure?: 'weekly' | 'rotating' | 'block' | 'frequency'
    ): string => {
        if (!user) throw new Error('User not authenticated');

        // Create session in memory only (saved to DB on "Finish Workout")
        const tempId = `temp-${Date.now()}`;
        // Generate session name based on program structure
        let sessionName: string;
        if (programStructure === 'rotating' || programStructure === 'block') {
            // Rotating and Block programs never show "Week", just the day name
            // These are cyclical programs where the day name (Day A/B/C or Block 1/2/3) is sufficient
            sessionName = dayName;
        } else if (totalWeeks === 1) {
            // Single-week programs: just show the day name
            sessionName = dayName;
        } else {
            // Multi-week programs (weekly, frequency): show "Week X – Day Name"
            sessionName = `Week ${weekNumber} – ${dayName}`;
        }
        const sessionDate = new Date().toISOString().split('T')[0];

        const exercises: WorkoutExercise[] = dayExercises.map((ex, index) => ({
            id: `temp-ex-${Date.now()}-${index}`,
            exercise_id: ex.exercise_id,
            exercise_name: ex.exercise_name,
            sets: ex.sets,
            reps: ex.reps?.length ? ex.reps : [10, 10, 10],
            weight: undefined,
            notes: undefined,
            alternatives: ex.alternatives || []
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
            id: `temp-ex-${Date.now()}-${Math.random().toString(36).slice(2)}`,
            exercise_id: exerciseId,
            exercise_name: exerciseName,
            sets,
            reps,
            weight: weight ?? 0,
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

    const swapExerciseAlternative = async (entryId: string, alternativeName: string) => {
        if (!currentSession) throw new Error('No active session');

        // Find the exercise
        const exercise = currentSession.exercises.find(ex => ex.id === entryId);
        if (!exercise) return;

        // Check if swapping back to original
        if (exercise.original_exercise_name && alternativeName === exercise.original_exercise_name) {
            // Swap back to original
            setCurrentSession(prev => prev ? {
                ...prev,
                exercises: prev.exercises.map(ex =>
                    ex.id === entryId
                        ? {
                            ...ex,
                            exercise_id: ex.original_exercise_id!,
                            exercise_name: ex.original_exercise_name!,
                            original_exercise_id: undefined,
                            original_exercise_name: undefined
                        }
                        : ex
                )
            } : null);
            return;
        }

        // Check if it's a valid alternative
        if (!exercise.alternatives || !exercise.alternatives.includes(alternativeName)) {
            return;
        }

        // Find the alternative exercise in the exercises list
        const { data: alternativeExercise, error } = await supabase
            .from('exercises')
            .select('id, name')
            .eq('name', alternativeName)
            .limit(1)
            .single();

        if (error || !alternativeExercise) {
            console.error('Alternative exercise not found:', alternativeName, error);
            return;
        }

        // Update the exercise with the alternative
        setCurrentSession(prev => prev ? {
            ...prev,
            exercises: prev.exercises.map(ex =>
                ex.id === entryId
                    ? {
                        ...ex,
                        original_exercise_id: ex.original_exercise_id || ex.exercise_id,
                        original_exercise_name: ex.original_exercise_name || ex.exercise_name,
                        exercise_id: alternativeExercise.id,
                        exercise_name: alternativeName
                    }
                    : ex
            )
        } : null);
    };

    const AUTO_SAVE_DELAY_MS = 3500;

    /** Persist session to DB without marking completed (for auto-save). Returns new session id if inserted. */
    const persistSessionToDb = async (session: WorkoutSession, markCompleted: boolean): Promise<string | null> => {
        if (!user) return null;
        const isNewSession = session.id?.startsWith('temp-');

        if (isNewSession) {
            const { data: sessionData, error: sessionError } = await supabase
                .from('workout_sessions')
                .insert({
                    user_id: user.id,
                    session_type: session.session_type,
                    session_name: session.session_name,
                    session_date: session.session_date,
                    program_id: session.program_id || null,
                    week_number: session.week_number || null,
                    day_name: session.day_name || null,
                    completed_at: markCompleted ? new Date().toISOString() : null
                })
                .select()
                .single();

            if (sessionError) throw sessionError;

            if (session.exercises.length > 0) {
                const logsToInsert = session.exercises.map((ex, index) => ({
                    session_id: sessionData.id,
                    exercise_id: ex.exercise_id,
                    exercise_name: ex.exercise_name,
                    sets_completed: ex.sets,
                    reps_per_set: ex.reps,
                    weight_per_set: ex.reps.map((_, i) => ex.weight_per_set?.[i] ?? ex.weight ?? 0),
                    notes: ex.notes || null,
                    exercise_order: index + 1
                }));
                const { error: logsError } = await supabase.from('workout_logs').insert(logsToInsert);
                if (logsError) throw logsError;
            }
            return sessionData.id;
        } else {
            const sessionId = session.id!;
            await supabase.from('workout_sessions').update({
                session_name: session.session_name,
                session_date: session.session_date,
                ...(markCompleted ? { completed_at: new Date().toISOString() } : {})
            }).eq('id', sessionId);

            await supabase.from('workout_logs').delete().eq('session_id', sessionId);
            if (session.exercises.length > 0) {
                const logsToInsert = session.exercises.map((ex, index) => ({
                    session_id: sessionId,
                    exercise_id: ex.exercise_id,
                    exercise_name: ex.exercise_name,
                    sets_completed: ex.sets,
                    reps_per_set: ex.reps,
                    weight_per_set: ex.reps.map((_, i) => ex.weight_per_set?.[i] ?? ex.weight ?? 0),
                    notes: ex.notes || null,
                    exercise_order: index + 1
                }));
                const { error: logsError } = await supabase.from('workout_logs').insert(logsToInsert);
                if (logsError) throw logsError;
            }
            return null;
        }
    };

    const saveSession = async (): Promise<string> => {
        if (!currentSession || !user) throw new Error('No active session');

        setLoading(true);
        try {
            const isNewSession = currentSession.id?.startsWith('temp-');
            const newId = await persistSessionToDb(currentSession, true);
            if (isNewSession && newId) return newId;
            return currentSession.id!;
        } catch (error) {
            console.error('Error saving session:', error);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    // Debounced auto-save: persist to DB without marking completed (3.5s after last change)
    const autoSaveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const sessionRefForAutoSave = useRef<WorkoutSession | null>(null);

    useEffect(() => {
        if (!currentSession || !user) return;
        sessionRefForAutoSave.current = currentSession;
        if (autoSaveTimeoutRef.current) clearTimeout(autoSaveTimeoutRef.current);
        autoSaveTimeoutRef.current = setTimeout(async () => {
            autoSaveTimeoutRef.current = null;
            const session = sessionRefForAutoSave.current;
            if (!session) return;
            try {
                const newId = await persistSessionToDb(session, false);
                if (newId && session.id?.startsWith('temp-')) {
                    setCurrentSession(prev => prev && prev.id === session.id ? { ...prev, id: newId } : prev);
                }
            } catch (err) {
                console.error('Auto-save failed:', err);
            }
        }, AUTO_SAVE_DELAY_MS);
        return () => {
            if (autoSaveTimeoutRef.current) clearTimeout(autoSaveTimeoutRef.current);
        };
    }, [currentSession, user?.id]);

    // Visibility re-fetch: when user returns to tab, refresh session from DB
    useEffect(() => {
        const handleVisibility = async () => {
            if (document.visibilityState !== 'visible') return;
            const session = sessionRefForAutoSave.current ?? currentSession;
            if (!session?.id || session.id.startsWith('temp-') || !user) return;
            try {
                const { data: row, error } = await supabase
                    .from('workout_sessions')
                    .select('*')
                    .eq('id', session.id)
                    .single();
                if (error || !row) return;
                const { data: logsData, error: logsError } = await supabase
                    .from('workout_logs')
                    .select('*')
                    .eq('session_id', session.id)
                    .order('exercise_order', { ascending: true });
                if (logsError) return;
                const exercises: WorkoutExercise[] = (logsData || []).map(log => {
                    const reps = typeof log.reps_per_set === 'string' ? JSON.parse(log.reps_per_set) : log.reps_per_set;
                    const wp = Array.isArray(log.weight_per_set) ? log.weight_per_set : [];
                    const full = reps?.length ? [...wp].slice(0, reps.length) : [];
                    const defaultW = full[0] ?? 0;
                    const overrides = full.map(w => (w !== defaultW ? w : undefined));
                    return {
                        id: log.id,
                        exercise_id: log.exercise_id,
                        exercise_name: log.exercise_name,
                        sets: log.sets_completed,
                        reps,
                        weight: defaultW,
                        weight_per_set: overrides.some(x => x !== undefined) ? overrides : undefined,
                        notes: log.notes
                    };
                });
                const refreshed: WorkoutSession = {
                    id: row.id,
                    user_id: row.user_id,
                    session_type: row.session_type,
                    session_name: row.session_name,
                    session_date: row.session_date,
                    program_id: row.program_id,
                    week_number: row.week_number,
                    day_name: row.day_name,
                    exercises
                };
                setCurrentSession(refreshed);
            } catch (e) {
                console.error('Visibility re-fetch failed:', e);
            }
        };
        document.addEventListener('visibilitychange', handleVisibility);
        return () => document.removeEventListener('visibilitychange', handleVisibility);
    }, [user?.id]);

    const clearSession = () => {
        setCurrentSession(null);
        setExistingSession(null);
        isEditingRef.current = false;
        if (typeof window !== 'undefined') {
            sessionStorage.removeItem(SESSION_STORAGE_KEY);
        }
    };

    /** Clear local session and, if it was already persisted (auto-save), remove it from DB so it doesn't show as "workout in progress". */
    const abandonSession = async (): Promise<void> => {
        const session = currentSession;
        if (session?.id && !session.id.startsWith('temp-')) {
            try {
                await supabase.from('workout_logs').delete().eq('session_id', session.id);
                await supabase.from('workout_sessions').delete().eq('id', session.id);
            } catch (err) {
                console.error('Failed to remove abandoned session from DB:', err);
            }
        }
        clearSession();
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
        abandonSession,
        checkForExistingSession,
        swapExerciseAlternative
    };
}
