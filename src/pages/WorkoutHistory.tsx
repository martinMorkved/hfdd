import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Modal } from '../components/Modal';
import { ExerciseHistoryButton } from '../components/ExerciseHistoryButton';

interface WorkoutSession {
    id: string;
    session_name: string;
    session_date: string;
    session_type: 'program' | 'freeform';
    created_at: string;
}

interface WorkoutLog {
    id: string;
    exercise_id: string;
    exercise_name: string;
    sets_completed: number;
    reps_per_set: number[];
    weight_per_set: number[];
    notes?: string;
}

export default function WorkoutHistory() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [sessions, setSessions] = useState<WorkoutSession[]>([]);
    const [selectedSession, setSelectedSession] = useState<WorkoutSession | null>(null);
    const [sessionLogs, setSessionLogs] = useState<WorkoutLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingLogs, setLoadingLogs] = useState(false);
    const [showMergeModal, setShowMergeModal] = useState(false);
    const [sessionsToMerge, setSessionsToMerge] = useState<WorkoutSession[]>([]);
    const [mergeLoading, setMergeLoading] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingSession, setEditingSession] = useState<WorkoutSession | null>(null);
    const [editSessionName, setEditSessionName] = useState('');
    const [editLoading, setEditLoading] = useState(false);
    const [showSelectiveMergeModal, setShowSelectiveMergeModal] = useState(false);
    const [selectedSessionsForMerge, setSelectedSessionsForMerge] = useState<Set<string>>(new Set());


    useEffect(() => {
        loadWorkoutSessions();
    }, []);

    const loadWorkoutSessions = async () => {
        if (!user) return;

        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('workout_sessions')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setSessions(data || []);
        } catch (error) {
            console.error('Error loading workout sessions:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadSessionLogs = async (sessionId: string) => {
        try {
            setLoadingLogs(true);
            const { data, error } = await supabase
                .from('workout_logs')
                .select('*')
                .eq('session_id', sessionId)
                .order('exercise_order', { ascending: true });

            if (error) throw error;

            // Parse the reps and weights JSON for each log
            const logsWithParsedData = (data || []).map(log => {
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
                    weight_per_set: parsedWeights
                };
            });

            setSessionLogs(logsWithParsedData);
        } catch (error) {
            console.error('Error loading session logs:', error);
        } finally {
            setLoadingLogs(false);
        }
    };

    const handleSessionClick = (session: WorkoutSession) => {
        setSelectedSession(session);
        loadSessionLogs(session.id);
    };

    const handleEditSession = (session: WorkoutSession) => {
        setEditingSession(session);
        setEditSessionName(session.session_name);
        setShowEditModal(true);
    };

    const handleSaveEdit = async () => {
        if (!editingSession || !editSessionName.trim()) return;

        try {
            setEditLoading(true);
            const { error } = await supabase
                .from('workout_sessions')
                .update({ session_name: editSessionName.trim() })
                .eq('id', editingSession.id);

            if (error) throw error;

            // Update local state
            setSessions(prev => prev.map(session =>
                session.id === editingSession.id
                    ? { ...session, session_name: editSessionName.trim() }
                    : session
            ));

            // Update selected session if it's the one being edited
            if (selectedSession?.id === editingSession.id) {
                setSelectedSession(prev => prev ? { ...prev, session_name: editSessionName.trim() } : null);
            }

            setShowEditModal(false);
            setEditingSession(null);
            setEditSessionName('');
        } catch (error) {
            console.error('Error updating session name:', error);
        } finally {
            setEditLoading(false);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-GB', {
            weekday: 'short',
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    const getSessionsByDate = () => {
        const grouped: { [key: string]: WorkoutSession[] } = {};
        sessions.forEach(session => {
            const date = session.session_date;
            if (!grouped[date]) {
                grouped[date] = [];
            }
            grouped[date].push(session);
        });
        return grouped;
    };

    const handleMergeSessions = async (sessions: WorkoutSession[]) => {
        if (sessions.length < 2) return;

        setSessionsToMerge(sessions);
        setShowMergeModal(true);
    };

    const handleSelectiveMerge = (sessions: WorkoutSession[]) => {
        setSessionsToMerge(sessions);
        setSelectedSessionsForMerge(new Set());
        setShowSelectiveMergeModal(true);
    };

    const toggleSessionSelection = (sessionId: string) => {
        const newSelected = new Set(selectedSessionsForMerge);
        if (newSelected.has(sessionId)) {
            newSelected.delete(sessionId);
        } else {
            newSelected.add(sessionId);
        }
        setSelectedSessionsForMerge(newSelected);
    };

    const performSelectiveMerge = async (targetSessionId: string) => {
        if (!user || selectedSessionsForMerge.size === 0) return;

        try {
            setMergeLoading(true);

            const sessionsToMerge = sessions.filter(session =>
                selectedSessionsForMerge.has(session.id) && session.id !== targetSessionId
            );

            // Get all exercises from sessions to merge
            const exercisesToMove: any[] = [];
            for (const session of sessionsToMerge) {
                const { data: logs, error } = await supabase
                    .from('workout_logs')
                    .select('*')
                    .eq('session_id', session.id);

                if (error) throw error;
                exercisesToMove.push(...(logs || []));
            }

            // Move exercises to target session
            for (const exercise of exercisesToMove) {
                const { error } = await supabase
                    .from('workout_logs')
                    .update({ session_id: targetSessionId })
                    .eq('id', exercise.id);

                if (error) throw error;
            }

            // Delete the merged sessions
            for (const session of sessionsToMerge) {
                const { error } = await supabase
                    .from('workout_sessions')
                    .delete()
                    .eq('id', session.id);

                if (error) throw error;
            }

            // Reload sessions
            await loadWorkoutSessions();
            setShowSelectiveMergeModal(false);
            setSessionsToMerge([]);
            setSelectedSessionsForMerge(new Set());

        } catch (error) {
            console.error('Error merging sessions:', error);
        } finally {
            setMergeLoading(false);
        }
    };

    const performMerge = async (targetSessionId: string, sessionsToMerge: WorkoutSession[]) => {
        if (!user) return;

        try {
            setMergeLoading(true);

            // Get all exercises from sessions to merge
            const exercisesToMove: any[] = [];
            for (const session of sessionsToMerge) {
                if (session.id === targetSessionId) continue;

                const { data: logs, error } = await supabase
                    .from('workout_logs')
                    .select('*')
                    .eq('session_id', session.id);

                if (error) throw error;
                exercisesToMove.push(...(logs || []));
            }

            // Move exercises to target session
            for (const exercise of exercisesToMove) {
                const { error } = await supabase
                    .from('workout_logs')
                    .update({ session_id: targetSessionId })
                    .eq('id', exercise.id);

                if (error) throw error;
            }

            // Delete the merged sessions
            for (const session of sessionsToMerge) {
                if (session.id === targetSessionId) continue;

                const { error } = await supabase
                    .from('workout_sessions')
                    .delete()
                    .eq('id', session.id);

                if (error) throw error;
            }

            // Reload sessions
            await loadWorkoutSessions();
            setShowMergeModal(false);
            setSessionsToMerge([]);

        } catch (error) {
            console.error('Error merging sessions:', error);
        } finally {
            setMergeLoading(false);
        }
    };



    const startEditingSession = async () => {
        if (!selectedSession) return;

        try {
            // Load the session data with exercises
            const { data: logsData, error } = await supabase
                .from('workout_logs')
                .select('*')
                .eq('session_id', selectedSession.id)
                .order('exercise_order', { ascending: true });

            if (error) throw error;

            const exercises = (logsData || []).map(log => ({
                id: log.id,
                exercise_id: log.exercise_id,
                exercise_name: log.exercise_name,
                sets: log.sets_completed,
                reps: typeof log.reps_per_set === 'string' ? JSON.parse(log.reps_per_set) : log.reps_per_set,
                weight: log.weight_per_set && log.weight_per_set.length > 0 ? log.weight_per_set[0] : null,
                notes: log.notes
            }));

            const sessionData = {
                id: selectedSession.id,
                user_id: user!.id,
                session_type: selectedSession.session_type,
                session_name: selectedSession.session_name,
                session_date: selectedSession.session_date,
                exercises
            };

            // Navigate to WorkoutLogger with session data

            navigate('/log-workout', {
                state: {
                    editSession: sessionData
                }
            });
        } catch (error) {
            console.error('Error loading session for editing:', error);
        }
    };





    if (loading) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center">
                <div className="text-white text-xl">Loading workout history...</div>
            </div>
        );
    }

    const sessionsByDate = getSessionsByDate();

    return (
        <div className="min-h-screen bg-gray-900">
            <div className="p-8">
                <div className="max-w-6xl mx-auto">
                    {/* Header */}
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-white mb-2">
                            Workout History
                        </h1>
                        <p className="text-gray-400">
                            View your past workout sessions and exercises
                        </p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Sessions List */}
                        <div className="lg:col-span-1">
                            <div className="bg-gray-800 rounded-lg p-6">
                                <h2 className="text-xl font-bold text-white mb-4">
                                    Workout Sessions
                                </h2>

                                {sessions.length === 0 ? (
                                    <div className="text-center py-8">
                                        <div className="text-gray-400 text-lg mb-2">
                                            No workout sessions yet
                                        </div>
                                        <p className="text-gray-500 text-sm">
                                            Start logging workouts to see them here
                                        </p>
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        {Object.entries(sessionsByDate).map(([date, dateSessions]) => (
                                            <div key={date}>
                                                <div className="flex items-center justify-between mb-3">
                                                    <h3 className="text-lg font-semibold text-white">
                                                        {formatDate(date)}
                                                    </h3>
                                                    {dateSessions.length > 1 && (
                                                        <div className="flex gap-2">
                                                            <button
                                                                onClick={() => handleMergeSessions(dateSessions)}
                                                                className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700 transition"
                                                            >
                                                                Merge All ({dateSessions.length})
                                                            </button>
                                                            <button
                                                                onClick={() => handleSelectiveMerge(dateSessions)}
                                                                className="text-xs bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700 transition"
                                                            >
                                                                Select Merge
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="space-y-2">
                                                    {dateSessions.map((session) => (
                                                        <div key={session.id} className="relative group">
                                                            <button
                                                                onClick={() => handleSessionClick(session)}
                                                                className={`w-full text-left p-3 rounded-lg transition ${selectedSession?.id === session.id
                                                                    ? 'bg-cyan-600 text-white'
                                                                    : 'bg-gray-700 hover:bg-gray-600 text-white'
                                                                    }`}
                                                            >
                                                                <div className="font-semibold mb-1">
                                                                    {session.session_name}
                                                                </div>
                                                                <div className="text-xs opacity-80">
                                                                    {session.session_type === 'freeform' ? 'Free-form' : 'Program'}
                                                                </div>
                                                            </button>
                                                            <button
                                                                onClick={() => handleEditSession(session)}
                                                                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-white text-sm"
                                                            >
                                                                ✏️
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Session Details */}
                        <div className="lg:col-span-2">
                            {selectedSession ? (
                                <div className="bg-gray-800 rounded-lg p-6">
                                    <div className="flex items-center justify-between mb-6">
                                        <div>
                                            <h2 className="text-2xl font-bold text-white">
                                                {selectedSession.session_name}
                                            </h2>
                                            <p className="text-gray-400">
                                                {formatDate(selectedSession.session_date)}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <button
                                                onClick={() => handleEditSession(selectedSession)}
                                                className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-500 transition"
                                            >
                                                Edit Name
                                            </button>
                                            <button
                                                onClick={startEditingSession}
                                                className="px-3 py-1 bg-cyan-600 text-white rounded text-sm hover:bg-cyan-700 transition"
                                            >
                                                Edit Workout
                                            </button>
                                            <div className="text-right">
                                                <div className="text-sm text-gray-400">Session Type</div>
                                                <div className="text-white font-semibold">
                                                    {selectedSession.session_type === 'freeform' ? 'Free-form' : 'Program'}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {loadingLogs ? (
                                        <div className="text-center py-8">
                                            <div className="text-cyan-400 text-lg">Loading exercises...</div>
                                        </div>
                                    ) : sessionLogs.length === 0 ? (
                                        <div className="text-center py-8">
                                            <div className="text-gray-400 text-lg">
                                                No exercises logged for this session
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            <h3 className="text-lg font-semibold text-white mb-4">
                                                Exercises ({sessionLogs.length})
                                            </h3>

                                            {sessionLogs.map((log) => (
                                                <div key={log.id} className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                                                    <div className="flex items-center justify-between mb-4">
                                                        <h3 className="text-xl font-bold text-white">{log.exercise_name}</h3>
                                                        <div className="flex gap-2">
                                                            <ExerciseHistoryButton
                                                                exerciseId={log.exercise_id}
                                                                exerciseName={log.exercise_name}
                                                                variant="icon"
                                                            />
                                                        </div>
                                                    </div>

                                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                                        <div>
                                                            <span className="text-gray-400">Sets:</span>
                                                            <span className="text-white ml-2">{log.sets_completed}</span>
                                                        </div>
                                                        <div>
                                                            <span className="text-gray-400">Weight:</span>
                                                            <span className="text-white ml-2">
                                                                {log.weight_per_set && log.weight_per_set.length > 0 ? `${log.weight_per_set[0]} kg` : 'Bodyweight'}
                                                            </span>
                                                        </div>
                                                        <div>
                                                            <span className="text-gray-400">Reps:</span>
                                                            <span className="text-white ml-2">
                                                                {log.reps_per_set ? log.reps_per_set.join(', ') : 'N/A'}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {log.notes && (
                                                        <div className="mt-3 pt-3 border-t border-gray-600">
                                                            <span className="text-gray-400 text-sm">Notes:</span>
                                                            <p className="text-white text-sm mt-1">{log.notes}</p>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="bg-gray-800 rounded-lg p-6">
                                    <div className="text-center py-12">
                                        <div className="text-gray-400 text-lg mb-2">
                                            Select a workout session
                                        </div>
                                        <p className="text-gray-500 text-sm">
                                            Choose a session from the list to view its details
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Edit Session Name Modal */}
            <Modal
                isOpen={showEditModal}
                onClose={() => setShowEditModal(false)}
                title="Edit Session Name"
                maxWidth="max-w-md"
            >
                <div>
                    <p className="text-gray-300 mb-4">
                        Update the name of your workout session:
                    </p>
                    <input
                        type="text"
                        value={editSessionName}
                        onChange={(e) => setEditSessionName(e.target.value)}
                        className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-cyan-500 focus:outline-none mb-4"
                        placeholder="Enter new session name..."
                        autoFocus
                    />
                    <div className="flex gap-3">
                        <button
                            onClick={() => setShowEditModal(false)}
                            className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSaveEdit}
                            disabled={!editSessionName.trim() || editLoading}
                            className="flex-1 px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition disabled:bg-gray-600 disabled:cursor-not-allowed"
                        >
                            {editLoading ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Selective Merge Modal */}
            <Modal
                isOpen={showSelectiveMergeModal}
                onClose={() => setShowSelectiveMergeModal(false)}
                title="Merge Workout Sessions"
                maxWidth="max-w-lg"
            >
                <div>
                    <p className="text-gray-300 mb-6">
                        Choose which sessions to combine and where to put all the exercises.
                    </p>

                    {/* Step 1: Select sessions to merge */}
                    <div className="mb-6">
                        <h3 className="text-lg font-semibold text-white mb-3">
                            Step 1: Select sessions to merge
                        </h3>
                        <div className="space-y-2">
                            {sessionsToMerge.map((session, index) => (
                                <div key={session.id} className="flex items-center gap-3 p-3 bg-gray-700 rounded-lg">
                                    <input
                                        type="checkbox"
                                        id={`merge-${session.id}`}
                                        checked={selectedSessionsForMerge.has(session.id)}
                                        onChange={() => toggleSessionSelection(session.id)}
                                        className="w-5 h-5 text-cyan-600 bg-gray-600 border-gray-500 rounded focus:ring-cyan-500"
                                    />
                                    <label htmlFor={`merge-${session.id}`} className="flex-1 cursor-pointer">
                                        <div className="font-semibold text-white">
                                            {session.session_name}
                                        </div>
                                        <div className="text-sm text-gray-400">
                                            {session.session_type === 'freeform' ? 'Free-form' : 'Program'} • Session {index + 1}
                                        </div>
                                    </label>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Step 2: Choose target session */}
                    <div className="mb-6">
                        <h3 className="text-lg font-semibold text-white mb-3">
                            Step 2: Choose where to put all exercises
                        </h3>
                        <div className="space-y-2">
                            {sessionsToMerge.map((session, index) => (
                                <button
                                    key={session.id}
                                    onClick={() => performSelectiveMerge(session.id)}
                                    disabled={selectedSessionsForMerge.size === 0 || mergeLoading}
                                    className={`w-full text-left p-4 rounded-lg transition ${selectedSessionsForMerge.size === 0 || mergeLoading
                                        ? 'bg-gray-600 opacity-50 cursor-not-allowed'
                                        : 'bg-gray-700 hover:bg-gray-600 cursor-pointer'
                                        }`}
                                >
                                    <div className="font-semibold text-white">
                                        {session.session_name}
                                    </div>
                                    <div className="text-sm text-gray-400">
                                        {session.session_type === 'freeform' ? 'Free-form' : 'Program'} • Session {index + 1}
                                    </div>
                                    {selectedSessionsForMerge.size > 0 && (
                                        <div className="text-xs text-cyan-400 mt-1">
                                            Click to merge {selectedSessionsForMerge.size} session{selectedSessionsForMerge.size > 1 ? 's' : ''} here
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Summary */}
                    {selectedSessionsForMerge.size > 0 && (
                        <div className="mb-6 p-4 bg-cyan-900/20 border border-cyan-500 rounded-lg">
                            <div className="text-cyan-400 font-semibold mb-1">
                                Summary
                            </div>
                            <div className="text-sm text-gray-300">
                                {selectedSessionsForMerge.size} session{selectedSessionsForMerge.size > 1 ? 's' : ''} will be merged into your selected target session.
                                All exercises will be preserved.
                            </div>
                        </div>
                    )}

                    {/* Action buttons */}
                    <div className="flex gap-3">
                        <button
                            onClick={() => setShowSelectiveMergeModal(false)}
                            className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition"
                        >
                            Cancel
                        </button>
                        {selectedSessionsForMerge.size === 0 && (
                            <div className="flex-1 px-4 py-2 bg-gray-600 text-gray-400 rounded-lg cursor-not-allowed">
                                Select sessions first
                            </div>
                        )}
                    </div>
                </div>
            </Modal>

            {/* Merge All Sessions Modal */}
            <Modal
                isOpen={showMergeModal}
                onClose={() => setShowMergeModal(false)}
                title="Merge All Sessions"
                maxWidth="max-w-md"
            >
                <div>
                    <p className="text-gray-300 mb-4">
                        Select which session to keep as the main session. All exercises from other sessions will be moved to it.
                    </p>
                    <div className="space-y-3 mb-6">
                        {sessionsToMerge.map((session) => (
                            <button
                                key={session.id}
                                onClick={() => performMerge(session.id, sessionsToMerge)}
                                disabled={mergeLoading}
                                className="w-full text-left p-3 bg-gray-700 rounded-lg hover:bg-gray-600 transition disabled:opacity-50"
                            >
                                <div className="font-semibold text-white">
                                    {session.session_name}
                                </div>
                                <div className="text-sm text-gray-400">
                                    {session.session_type === 'freeform' ? 'Free-form' : 'Program'}
                                </div>
                            </button>
                        ))}
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={() => setShowMergeModal(false)}
                            className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </Modal>


        </div>
    );
}
