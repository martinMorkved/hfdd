import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import type { WorkoutSession } from './useWorkoutLogging';

export interface PreviousLiftLog {
    reps_per_set: number[];
    weight_per_set: number[];
    session_date?: string;
    session_name?: string;
    program_id?: string | null;
    day_name?: string | null;
    created_at: string;
}

/** Pick best previous log: same program+day > same program > any. */
function pickBestLog(
    logs: PreviousLiftLog[],
    programId: string | undefined,
    dayName: string | undefined
): PreviousLiftLog | null {
    if (logs.length === 0) return null;
    if (programId && dayName) {
        const match = logs.find(
            (l) => l.program_id === programId && l.day_name === dayName
        );
        if (match) return match;
    }
    if (programId) {
        const match = logs.find((l) => l.program_id === programId);
        if (match) return match;
    }
    return logs[0];
}

function parseLog(raw: {
    reps_per_set: unknown;
    weight_per_set: unknown;
    created_at: string;
    session_date?: string;
    session_name?: string;
    workout_sessions?: { program_id?: string; day_name?: string; session_date?: string; session_name?: string };
}): PreviousLiftLog {
    let reps: number[] = [];
    let weights: number[] = [];
    if (Array.isArray(raw.reps_per_set)) reps = raw.reps_per_set;
    else if (typeof raw.reps_per_set === 'string') {
        try {
            reps = JSON.parse(raw.reps_per_set);
        } catch {
            reps = [];
        }
    }
    if (Array.isArray(raw.weight_per_set)) weights = raw.weight_per_set;
    else if (typeof raw.weight_per_set === 'string') {
        try {
            weights = JSON.parse(raw.weight_per_set);
        } catch {
            weights = [];
        }
    }
    const session = raw.workout_sessions;
    return {
        reps_per_set: reps,
        weight_per_set: weights,
        session_date: session?.session_date ?? raw.session_date,
        session_name: session?.session_name ?? raw.session_name,
        program_id: session?.program_id,
        day_name: session?.day_name,
        created_at: raw.created_at
    };
}

/**
 * Loads "previous lift" for each exercise in the current session.
 * Priority: same program + same day > same program > same exercise (any session).
 */
export function usePreviousLiftsForSession(
    session: WorkoutSession | null
): { previousLifts: Record<string, PreviousLiftLog>; loading: boolean } {
    const { user } = useAuth();
    const [previousLifts, setPreviousLifts] = useState<Record<string, PreviousLiftLog>>({});
    const [loading, setLoading] = useState(false);

    const exerciseIds =
        session?.exercises?.map((e) => e.exercise_id).filter(Boolean) ?? [];
    const programId = session?.program_id;
    const dayName = session?.day_name;

    useEffect(() => {
        if (!user || exerciseIds.length === 0) {
            setPreviousLifts({});
            setLoading(false);
            return;
        }

        let cancelled = false;

        async function load() {
            setLoading(true);
            try {
                const { data, error } = await supabase
                    .from('workout_logs')
                    .select(
                        `
                        exercise_id,
                        reps_per_set,
                        weight_per_set,
                        created_at,
                        workout_sessions!fk_workout_logs_session_id(
                            session_date,
                            session_name,
                            program_id,
                            day_name
                        )
                    `
                    )
                    .in('exercise_id', exerciseIds)
                    .eq('workout_sessions.user_id', user.id)
                    .not('workout_sessions.completed_at', 'is', null)
                    .order('created_at', { ascending: false })
                    .limit(500);

                if (error) throw error;
                if (cancelled) return;

                const byExercise: Record<string, PreviousLiftLog[]> = {};
                for (const row of data || []) {
                    const log = parseLog(row as Parameters<typeof parseLog>[0]);
                    const eid = (row as { exercise_id: string }).exercise_id;
                    if (!byExercise[eid]) byExercise[eid] = [];
                    byExercise[eid].push(log);
                }

                const result: Record<string, PreviousLiftLog> = {};
                for (const eid of exerciseIds) {
                    const logs = byExercise[eid] ?? [];
                    const best = pickBestLog(logs, programId, dayName ?? undefined);
                    if (best) result[eid] = best;
                }
                setPreviousLifts(result);
            } catch (err) {
                console.error('Error loading previous lifts:', err);
                if (!cancelled) setPreviousLifts({});
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        load();
        return () => {
            cancelled = true;
        };
    }, [user?.id, exerciseIds.join(','), programId, dayName]);

    return { previousLifts, loading };
}

/** Format a previous lift for inline display, e.g. "12 kg × 10, 10 kg × 8" or "10, 10, 8 reps". */
export function formatPreviousLift(log: PreviousLiftLog): string {
    const { reps_per_set, weight_per_set } = log;
    if (!reps_per_set?.length) return 'No set details';
    const parts = reps_per_set.map((reps, i) => {
        const w = weight_per_set?.[i];
        if (w != null && w > 0) return `${w} kg × ${reps}`;
        return `${reps} reps`;
    });
    return parts.join(', ');
}

/** Format a single set's previous (for per-row display). Returns e.g. "12 kg × 10" or "10 reps" or null. */
export function formatPreviousSet(log: PreviousLiftLog | undefined, setIndex: number): string | null {
    if (!log?.reps_per_set?.length || setIndex >= log.reps_per_set.length) return null;
    const reps = log.reps_per_set[setIndex];
    const w = log.weight_per_set?.[setIndex];
    if (w != null && w > 0) return `${w} kg × ${reps}`;
    return `${reps} reps`;
}
