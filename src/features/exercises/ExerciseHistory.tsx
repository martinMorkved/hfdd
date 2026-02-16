import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { StatCard } from '../../components/ui/StatCard';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorMessage } from '../../components/ui/ErrorMessage';

interface ExerciseHistoryProps {
    exerciseId: string;
    exerciseName: string;
    isOpen: boolean;
    onClose: () => void;
    /** When set, show "last time for this day in program (programName)" */
    programId?: string;
    programName?: string;
    dayName?: string;
}

interface WorkoutLog {
    id: string;
    session_id: string;
    exercise_id: string;
    exercise_name: string;
    sets_completed: number;
    reps_per_set: number[];
    weight_per_set: number[];
    rest_time: number | null;
    notes: string | null;
    exercise_order: number;
    created_at: string;
    session_date?: string;
    session_name?: string;
    workout_sessions?: { program_id?: string; day_name?: string };
}

interface ExerciseStats {
    totalSessions: number;
    totalSets: number;
    totalReps: number;
    highestWeight: number;
    highestReps: number;
    mostSets: number;
    averageWeight: number;
    averageReps: number;
    firstWorkout: string;
    lastWorkout: string;
}

export const ExerciseHistory: React.FC<ExerciseHistoryProps> = ({
    exerciseId,
    exerciseName,
    isOpen,
    onClose,
    programId,
    programName,
    dayName
}) => {
    const { user } = useAuth();
    const [logs, setLogs] = useState<WorkoutLog[]>([]);
    const [stats, setStats] = useState<ExerciseStats | null>(null);
    const [lastTimeForProgramDay, setLastTimeForProgramDay] = useState<WorkoutLog | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen && exerciseId) {
            loadExerciseHistory();
        }
    }, [isOpen, exerciseId, programId, dayName]);

    const parseLog = (log: any): WorkoutLog => {
        let parsedReps: number[] = [];
        let parsedWeights: number[] = [];
        try {
            if (typeof log.reps_per_set === 'string') {
                parsedReps = JSON.parse(log.reps_per_set);
            } else if (Array.isArray(log.reps_per_set)) {
                parsedReps = log.reps_per_set;
            }
            if (typeof log.weight_per_set === 'string') {
                parsedWeights = JSON.parse(log.weight_per_set);
            } else if (Array.isArray(log.weight_per_set)) {
                parsedWeights = log.weight_per_set;
            }
        } catch (parseError) {
            console.error('Error parsing data:', parseError);
        }
        return {
            ...log,
            reps_per_set: parsedReps,
            weight_per_set: parsedWeights,
            session_date: log.workout_sessions?.session_date,
            session_name: log.workout_sessions?.session_name
        };
    };

    const loadExerciseHistory = async () => {
        if (!user) return;

        try {
            setLoading(true);
            setError(null);
            setLastTimeForProgramDay(null);

            const { data, error } = await supabase
                .from('workout_logs')
                .select(`
                    *,
                    workout_sessions!fk_workout_logs_session_id(
                        session_date,
                        session_name,
                        program_id,
                        day_name
                    )
                `)
                .eq('exercise_id', exerciseId)
                .eq('workout_sessions.user_id', user.id)
                // Only include finished workouts; exclude in-progress sessions created by auto-save
                .not('workout_sessions.completed_at', 'is', null)
                .order('created_at', { ascending: false });

            if (error) throw error;

            const parsedLogs = (data || []).map(parseLog);
            setLogs(parsedLogs);
            calculateStats(parsedLogs);

            if (programId && dayName) {
                const match = parsedLogs.find(
                    (log) =>
                        log.workout_sessions?.program_id === programId &&
                        log.workout_sessions?.day_name === dayName
                );
                if (match) setLastTimeForProgramDay(match);
            }
        } catch (err) {
            console.error('Error loading exercise history:', err);
            setError('Failed to load exercise history');
        } finally {
            setLoading(false);
        }
    };

    const calculateStats = (exerciseLogs: WorkoutLog[]) => {
        if (exerciseLogs.length === 0) {
            setStats(null);
            return;
        }

        let totalSessions = exerciseLogs.length;
        let totalSets = 0;
        let totalReps = 0;
        let highestWeight = 0;
        let highestReps = 0;
        let mostSets = 0;
        let totalWeight = 0;
        let totalRepsCount = 0;
        let weightCount = 0;

        exerciseLogs.forEach(log => {
            totalSets += log.sets_completed;
            if (log.sets_completed > mostSets) {
                mostSets = log.sets_completed;
            }

            // Calculate reps and weights
            if (Array.isArray(log.reps_per_set)) {
                log.reps_per_set.forEach((reps) => {
                    totalReps += reps;
                    totalRepsCount++;
                    if (reps > highestReps) {
                        highestReps = reps;
                    }
                });
            } else {
                console.warn('reps_per_set is not an array for log:', log.id, 'reps_per_set:', log.reps_per_set);
            }

            // Calculate weights
            if (Array.isArray(log.weight_per_set)) {
                log.weight_per_set.forEach((weight) => {
                    if (weight > 0) {
                        totalWeight += weight;
                        weightCount++;
                        if (weight > highestWeight) {
                            highestWeight = weight;
                        }
                    }
                });
            }
        });

        const stats: ExerciseStats = {
            totalSessions,
            totalSets,
            totalReps,
            highestWeight,
            highestReps,
            mostSets,
            averageWeight: weightCount > 0 ? Math.round(totalWeight / weightCount) : 0,
            averageReps: totalRepsCount > 0 ? Math.round(totalReps / totalRepsCount) : 0,
            firstWorkout: exerciseLogs[exerciseLogs.length - 1]?.created_at || '',
            lastWorkout: exerciseLogs[0]?.created_at || ''
        };

        setStats(stats);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const formatWeight = (weight: number) => {
        return weight > 0 ? `${weight} kg` : 'N/A';
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-gray-700">
                    <h2 className="text-2xl font-bold text-white">Exercise History: {exerciseName}</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-white transition"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                    {loading && (
                        <div className="text-center py-8">
                            <div className="text-cyan-400 text-lg">Loading exercise history...</div>
                        </div>
                    )}

                    {error && (
                        <ErrorMessage message={error} className="mb-6" />
                    )}

                    {!loading && !error && stats && (
                        <>
                            {/* Statistics */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                                <StatCard label="Total Sessions" value={stats.totalSessions} />
                                <StatCard label="Total Sets" value={stats.totalSets} />
                                <StatCard label="Total Reps" value={stats.totalReps} />
                                <StatCard label="Highest Weight" value={formatWeight(stats.highestWeight)} />
                                <StatCard label="Most Reps" value={stats.highestReps} />
                                <StatCard label="Most Sets" value={stats.mostSets} />
                                <StatCard label="Avg Weight" value={formatWeight(stats.averageWeight)} />
                                <StatCard label="Avg Reps" value={stats.averageReps} />
                            </div>
                        </>
                    )}

                    {/* Last time overview: one card only. From program → prefer program-day; else overall. Hide when no history. */}
                    {!loading && !error && logs.length > 0 && (() => {
                        const inProgramContext = !!(programName && dayName);
                        const showProgramDay = inProgramContext && lastTimeForProgramDay;
                        const logToShow = showProgramDay ? lastTimeForProgramDay : logs[0];
                        const title = showProgramDay
                            ? `Last time for this day in program (${programName})`
                            : 'Last time';
                        return (
                            <div className="mb-4 space-y-4">
                                <h3 className="text-xl font-semibold text-white">Exercise history</h3>
                                <div className="p-4 bg-cyan-900/20 border border-cyan-700/50 rounded-lg">
                                    <div className="text-cyan-400 text-sm font-medium mb-2">{title}</div>
                                    <div className="text-gray-300 text-sm mb-2">
                                        {logToShow.session_name || `Workout on ${formatDate(logToShow.session_date || logToShow.created_at)}`}
                                        {' · '}{formatDate(logToShow.session_date || logToShow.created_at)}
                                    </div>
                                    <div className="space-y-1 text-sm">
                                        {Array.isArray(logToShow.reps_per_set) ? logToShow.reps_per_set.map((reps, index) => (
                                            <div key={index} className="text-white">
                                                Set {index + 1}: {reps} reps
                                                {logToShow.weight_per_set?.[index] ? ` ${logToShow.weight_per_set[index]} kg` : ''}
                                            </div>
                                        )) : (
                                            <div className="text-gray-400">No set details</div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })()}

                    {/* Full history list (no separate title – flows from "Last time" card above) */}
                    {!loading && !error && logs.length > 0 && (
                        <div className="space-y-4">
                                {logs.map((log) => (
                                    <div key={log.id} className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                                        <div className="flex flex-col gap-0.5 mb-2 sm:flex-row sm:justify-between sm:items-start">
                                            <div className="text-white font-medium min-w-0">
                                                {log.session_name || `Workout on ${formatDate(log.session_date || log.created_at)}`}
                                            </div>
                                            <div className="text-gray-400 text-sm sm:shrink-0">
                                                {formatDate(log.created_at)}
                                            </div>
                                        </div>

                                        {/* Sets Details */}
                                        <div className="space-y-2">
                                            {Array.isArray(log.reps_per_set) ? log.reps_per_set.map((reps, index) => (
                                                <div key={index} className="flex items-center text-sm">
                                                    <span className="text-gray-400 w-16">Set {index + 1}:</span>
                                                    <span className="text-white mr-4">{reps} reps</span>
                                                    {log.weight_per_set && log.weight_per_set[index] && (
                                                        <span className="text-cyan-400">{log.weight_per_set[index]} kg</span>
                                                    )}
                                                </div>
                                            )) : (
                                                <div className="text-gray-400 text-sm">No set details available</div>
                                            )}
                                        </div>

                                        {log.notes && (
                                            <div className="mt-3 p-2 bg-gray-700 rounded text-sm text-gray-300">
                                                <span className="text-gray-400">Notes:</span> {log.notes}
                                            </div>
                                        )}
                                    </div>
                                ))}
                        </div>
                    )}

                    {!loading && !error && logs.length === 0 && (
                        <EmptyState
                            title="No workout history found for this exercise."
                            description="Start logging workouts to see your progress!"
                        />
                    )}

                    {/* Date Range (bottom of modal) */}
                    {!loading && !error && stats && (
                        <div className="mt-8 p-4 bg-gray-800 rounded-lg border border-gray-700">
                            <div className="text-cyan-400 text-sm font-medium mb-2">Date Range</div>
                            <div className="text-white">
                                <span className="text-gray-300">First workout:</span> {formatDate(stats.firstWorkout)} |
                                <span className="text-gray-300 ml-2">Last workout:</span> {formatDate(stats.lastWorkout)}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
