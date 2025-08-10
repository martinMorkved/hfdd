import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface ExerciseHistoryProps {
    exerciseId: string;
    exerciseName: string;
    isOpen: boolean;
    onClose: () => void;
}

interface WorkoutLog {
    id: string;
    session_id: string;
    exercise_id: string;
    exercise_name: string;
    sets: number; // Changed from sets_completed
    reps: number[]; // Will be parsed from string to array
    weight?: number; // Changed from weight_per_set array
    rest_time: number | null;
    notes: string | null;
    exercise_order: number;
    created_at: string;
    session_date?: string;
    session_name?: string;
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
    onClose
}) => {
    const { user } = useAuth();
    const [logs, setLogs] = useState<WorkoutLog[]>([]);
    const [stats, setStats] = useState<ExerciseStats | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen && exerciseId) {
            loadExerciseHistory();
        }
    }, [isOpen, exerciseId]);

    const loadExerciseHistory = async () => {
        if (!user) return;

        try {
            setLoading(true);
            setError(null);

            // Get all workout logs for this exercise, joined with session info
            const { data, error } = await supabase
                .from('workout_logs')
                .select(`
                    *,
                    workout_sessions!inner(
                        session_date,
                        session_name
                    )
                `)
                .eq('exercise_id', exerciseId)
                .eq('workout_sessions.user_id', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;

            // Parse the JSON arrays
            const parsedLogs = (data || []).map(log => {
                let parsedReps: number[] = [];

                try {
                    if (typeof log.reps === 'string') {
                        parsedReps = JSON.parse(log.reps);
                    } else if (Array.isArray(log.reps)) {
                        parsedReps = log.reps;
                    } else {
                        console.warn('Unexpected reps format:', log.reps);
                        parsedReps = [];
                    }
                } catch (parseError) {
                    console.error('Error parsing reps:', parseError, 'Raw reps:', log.reps);
                    parsedReps = [];
                }

                return {
                    ...log,
                    reps: parsedReps,
                    weight: log.weight,
                    session_date: log.workout_sessions?.session_date,
                    session_name: log.workout_sessions?.session_name
                };
            });

            setLogs(parsedLogs);
            calculateStats(parsedLogs);
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
            totalSets += log.sets;
            if (log.sets > mostSets) {
                mostSets = log.sets;
            }

            // Calculate reps and weights
            if (Array.isArray(log.reps)) {
                log.reps.forEach((reps) => {
                    totalReps += reps;
                    totalRepsCount++;
                    if (reps > highestReps) {
                        highestReps = reps;
                    }

                    if (log.weight) {
                        const weight = log.weight;
                        totalWeight += weight;
                        weightCount++;
                        if (weight > highestWeight) {
                            highestWeight = weight;
                        }
                    }
                });
            } else {
                console.warn('Reps is not an array for log:', log.id, 'reps:', log.reps);
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
                        <div className="mb-6 p-4 bg-red-900/20 border border-red-500 rounded-lg">
                            <p className="text-red-400">{error}</p>
                        </div>
                    )}

                    {!loading && !error && stats && (
                        <>
                            {/* Statistics */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                                <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                                    <div className="text-cyan-400 text-sm font-medium">Total Sessions</div>
                                    <div className="text-white text-2xl font-bold">{stats.totalSessions}</div>
                                </div>
                                <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                                    <div className="text-cyan-400 text-sm font-medium">Total Sets</div>
                                    <div className="text-white text-2xl font-bold">{stats.totalSets}</div>
                                </div>
                                <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                                    <div className="text-cyan-400 text-sm font-medium">Total Reps</div>
                                    <div className="text-white text-2xl font-bold">{stats.totalReps}</div>
                                </div>
                                <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                                    <div className="text-cyan-400 text-sm font-medium">Highest Weight</div>
                                    <div className="text-white text-2xl font-bold">{formatWeight(stats.highestWeight)}</div>
                                </div>
                                <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                                    <div className="text-cyan-400 text-sm font-medium">Most Reps</div>
                                    <div className="text-white text-2xl font-bold">{stats.highestReps}</div>
                                </div>
                                <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                                    <div className="text-cyan-400 text-sm font-medium">Most Sets</div>
                                    <div className="text-white text-2xl font-bold">{stats.mostSets}</div>
                                </div>
                                <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                                    <div className="text-cyan-400 text-sm font-medium">Avg Weight</div>
                                    <div className="text-white text-2xl font-bold">{formatWeight(stats.averageWeight)}</div>
                                </div>
                                <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                                    <div className="text-cyan-400 text-sm font-medium">Avg Reps</div>
                                    <div className="text-white text-2xl font-bold">{stats.averageReps}</div>
                                </div>
                            </div>

                            {/* Date Range */}
                            <div className="mb-8 p-4 bg-gray-800 rounded-lg border border-gray-700">
                                <div className="text-cyan-400 text-sm font-medium mb-2">Date Range</div>
                                <div className="text-white">
                                    <span className="text-gray-300">First workout:</span> {formatDate(stats.firstWorkout)} |
                                    <span className="text-gray-300 ml-2">Last workout:</span> {formatDate(stats.lastWorkout)}
                                </div>
                            </div>
                        </>
                    )}

                    {/* Workout History */}
                    {!loading && !error && logs.length > 0 && (
                        <div>
                            <h3 className="text-xl font-semibold text-white mb-4">Workout History</h3>
                            <div className="space-y-4">
                                {logs.map((log) => (
                                    <div key={log.id} className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="text-white font-medium">
                                                {log.session_name || `Workout on ${formatDate(log.session_date || log.created_at)}`}
                                            </div>
                                            <div className="text-gray-400 text-sm">
                                                {formatDate(log.created_at)}
                                            </div>
                                        </div>

                                        <div className="text-gray-300 text-sm mb-2">
                                            {log.sets} sets completed
                                        </div>

                                        {/* Sets Details */}
                                        <div className="space-y-2">
                                            {Array.isArray(log.reps) ? log.reps.map((reps, index) => (
                                                <div key={index} className="flex items-center text-sm">
                                                    <span className="text-gray-400 w-16">Set {index + 1}:</span>
                                                    <span className="text-white mr-4">{reps} reps</span>
                                                    {log.weight && (
                                                        <span className="text-cyan-400">{log.weight} kg</span>
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
                        </div>
                    )}

                    {!loading && !error && logs.length === 0 && (
                        <div className="text-center py-8">
                            <div className="text-gray-400 text-lg">No workout history found for this exercise.</div>
                            <div className="text-gray-500 text-sm mt-2">Start logging workouts to see your progress!</div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
