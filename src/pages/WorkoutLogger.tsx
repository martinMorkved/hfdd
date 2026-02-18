import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useWorkoutLogging, type WorkoutExercise, type ProgramDayExercise } from '../features/workouts/useWorkoutLogging';
import { usePreviousLiftsForSession, formatPreviousSet } from '../features/workouts/usePreviousLift';
import { useWorkoutProgram, type WorkoutProgram } from '../features/programs/useWorkoutProgram';
import { Modal } from '../components/ui/Modal';
import { Button } from '../components/ui/Button';
import { NumberInput } from '../components/ui/NumberInput';
import { TextInput } from '../components/ui/TextInput';
import { TextArea } from '../components/ui/TextArea';
import { LoadingScreen } from '../components/ui/LoadingScreen';
import { PageHeader } from '../components/ui/PageHeader';
import { PageLayout } from '../components/ui/PageLayout';
import { useAuth } from '../contexts/AuthContext';
import { ExerciseSelector, ExerciseHistoryButton } from '../features/exercises';
import { MobileExerciseSelector } from '../components/MobileExerciseSelector';
import { supabase } from '../lib/supabase';
import type { Exercise } from '../features/exercises/types';
import { PlusIcon, CheckIcon, CalendarIcon, TrashIcon } from '../components/icons';

export default function WorkoutLogger() {
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth();
    const { activeProgram, programs } = useWorkoutProgram();
    const {
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
        swapExerciseAlternative,
        updateSessionDate
    } = useWorkoutLogging();

    const { previousLifts } = usePreviousLiftsForSession(currentSession ?? null);

    const isProgramFlow = location.state?.sessionType === 'program';

    // Program that the current session belongs to (active or "different" program)
    const programForCurrentSession = useMemo(() => {
        if (!currentSession || currentSession.session_type !== 'program' || !currentSession.program_id) return activeProgram ?? null;
        return programs?.find(p => p.id === currentSession.program_id) ?? activeProgram ?? null;
    }, [currentSession?.id, currentSession?.session_type, currentSession?.program_id, programs, activeProgram]);

    const [showExercisePicker, setShowExercisePicker] = useState(false);
    const [showChangeDayModal, setShowChangeDayModal] = useState(false);
    const [sessionName, setSessionName] = useState(() => {
        const today = new Date();
        const dateStr = today.toLocaleDateString('en-GB', {
            weekday: 'short',
            day: 'numeric',
            month: 'short'
        });
        const userName = user?.email?.split('@')[0] || 'Workout';
        return `${userName}'s ${dateStr} Workout`;
    });
    const [showSessionModal, setShowSessionModal] = useState(false);
    const [showExistingSessionModal, setShowExistingSessionModal] = useState(false);
    const [selectedExercise, setSelectedExercise] = useState<any>(null);
    const [exerciseForm, setExerciseForm] = useState({
        reps: [10],
        weight: 0,
        notes: ''
    });

    // Mobile add exercise state
    const [isMobile, setIsMobile] = useState(false);
    const [showMobileAddExercise, setShowMobileAddExercise] = useState(false);
    const [exercises, setExercises] = useState<Exercise[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedMuscleGroups, setSelectedMuscleGroups] = useState<string[]>([]);
    const [mobileSelectedExerciseIds, setMobileSelectedExerciseIds] = useState<Set<string>>(new Set());
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [inProgressSession, setInProgressSession] = useState<{ id: string; session_name: string; session_type: string; session_date: string; user_id: string; program_id?: string; week_number?: number; day_name?: string } | null>(null);
    const [inProgressLoading, setInProgressLoading] = useState(false);
    const [finishSaveError, setFinishSaveError] = useState<string | null>(null);
    // Program day picker: which program's weeks/days we show; "different program" list visible; session date
    const [programForDayPicker, setProgramForDayPicker] = useState<WorkoutProgram | null>(null);
    const [showDifferentProgramList, setShowDifferentProgramList] = useState(false);
    const [sessionDateProgram, setSessionDateProgram] = useState(() => new Date().toISOString().split('T')[0]);
    const [sessionDateFreeform, setSessionDateFreeform] = useState(() => new Date().toISOString().split('T')[0]);
    const [changeDayModalDate, setChangeDayModalDate] = useState(() => new Date().toISOString().split('T')[0]);
    // Mobile layout detection
    useEffect(() => {
        const mq = window.matchMedia("(max-width: 767px)");
        const update = () => setIsMobile(mq.matches);
        update();
        mq.addEventListener("change", update);
        return () => mq.removeEventListener("change", update);
    }, []);

    // Load exercises from Supabase
    useEffect(() => {
        loadExercises();
    }, []);

    const loadExercises = async () => {
        try {
            const { data, error } = await supabase
                .from('exercises')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error loading exercises:', error);
                return;
            }

            setExercises(data || []);
        } catch (err) {
            console.error('Error loading exercises:', err);
        }
    };

    // Clear selection when opening mobile add-exercise panel
    useEffect(() => {
        if (showMobileAddExercise) {
            setMobileSelectedExerciseIds(new Set());
        }
    }, [showMobileAddExercise]);

    // Get unique muscle groups (handle comma-separated values)
    const muscleGroups = Array.from(new Set(
        exercises
            .flatMap(ex => {
                if (!ex.muscle_group) return [];
                return ex.muscle_group.split(',').map(g => g.trim()).filter(Boolean);
            })
    )) as string[];

    // Filter exercises by search term and selected muscle groups
    const filteredExercises = exercises.filter(ex => {
        const matchesSearch = searchTerm === "" ||
            ex.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (ex.description && ex.description.toLowerCase().includes(searchTerm.toLowerCase()));

        const matchesMuscleGroup = selectedMuscleGroups.length === 0 ||
            (ex.muscle_group && ex.muscle_group.split(',').map(g => g.trim()).some(group => selectedMuscleGroups.includes(group)));

        return matchesSearch && matchesMuscleGroup;
    });

    // Clear program session only if there is no active program (e.g. user deactivated all programs).
    // Do NOT clear when session.program_id !== activeProgram.id: user may have chosen "Log from different program".
    useEffect(() => {
        if (location.state?.editSession) return;
        if (!currentSession || currentSession.session_type !== 'program') return;
        if (!activeProgram) {
            clearSession();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentSession?.id, currentSession?.session_type, activeProgram?.id, location.state?.editSession]);

    // Check for edit session from WorkoutHistory
    useEffect(() => {
        const editSession = location.state?.editSession;

        if (editSession && !currentSession) {
            continueExistingSession(editSession);
        }
    }, [location.state, currentSession]);

    // Check for existing session and show modal if found (freeform flow only)
    useEffect(() => {
        if (isProgramFlow) return;
        if (existingSession && !currentSession && !showExistingSessionModal && !location.state?.editSession) {
            setShowExistingSessionModal(true);
        }
    }, [isProgramFlow, existingSession, currentSession, showExistingSessionModal, location.state]);

    // Auto-create session modal for freeform only
    useEffect(() => {
        if (isProgramFlow) return;
        if (!currentSession && !existingSession && !showSessionModal && !showExistingSessionModal && !location.state?.editSession) {
            setShowSessionModal(true);
            setSessionDateFreeform(new Date().toISOString().split('T')[0]);
        } else if (existingSession && showSessionModal) {
            setShowSessionModal(false);
        }
    }, [isProgramFlow, currentSession, existingSession, showSessionModal, showExistingSessionModal, location.state]);

    // When program day picker modal is shown, sync program and date to current defaults
    useEffect(() => {
        if (isProgramFlow && activeProgram && !currentSession) {
            setProgramForDayPicker(activeProgram);
            setShowDifferentProgramList(false);
            setSessionDateProgram(new Date().toISOString().split('T')[0]);
        }
    }, [isProgramFlow, activeProgram, currentSession]);

    // When showing program day picker (e.g. after refresh), check for an in-progress session to offer "Workout in progress"
    useEffect(() => {
        if (!user || !isProgramFlow || !activeProgram || currentSession) return;
        let cancelled = false;
        (async () => {
            const { data, error } = await supabase
                .from('workout_sessions')
                .select('id, session_name, session_type, session_date, user_id, program_id, week_number, day_name')
                .eq('user_id', user.id)
                .is('completed_at', null)
                .order('created_at', { ascending: false })
                .limit(1);
            if (!cancelled && !error && data?.[0]) setInProgressSession(data[0]);
            else if (!cancelled) setInProgressSession(null);
        })();
        return () => { cancelled = true; };
    }, [user?.id, isProgramFlow, activeProgram, currentSession]);

    const handleOpenInProgressWorkout = async () => {
        if (!inProgressSession || !user) return;
        setInProgressLoading(true);
        try {
            const { data: logsData, error } = await supabase
                .from('workout_logs')
                .select('*')
                .eq('session_id', inProgressSession.id)
                .order('exercise_order', { ascending: true });
            if (error) throw error;
            const exercises = (logsData || []).map((log: { id: string; exercise_id: string; exercise_name: string; sets_completed: number; reps_per_set: number[] | string; weight_per_set?: number[]; notes?: string }) => {
                const reps = typeof log.reps_per_set === 'string' ? JSON.parse(log.reps_per_set) : log.reps_per_set;
                const wp = Array.isArray(log.weight_per_set) ? log.weight_per_set : [];
                const full = reps?.length ? [...wp].slice(0, reps.length) : [];
                const defaultW = full[0] ?? 0;
                const overrides = full.map((w: number) => (w !== defaultW ? w : undefined));
                return {
                    id: log.id,
                    exercise_id: log.exercise_id,
                    exercise_name: log.exercise_name,
                    sets: log.sets_completed,
                    reps,
                    weight: defaultW,
                    weight_per_set: overrides.some((x: undefined | number) => x !== undefined) ? overrides : undefined,
                    notes: log.notes
                };
            });
            const sessionData = {
                id: inProgressSession.id,
                user_id: inProgressSession.user_id,
                session_type: inProgressSession.session_type as 'program' | 'freeform',
                session_name: inProgressSession.session_name,
                session_date: inProgressSession.session_date,
                program_id: inProgressSession.program_id,
                week_number: inProgressSession.week_number,
                day_name: inProgressSession.day_name,
                exercises
            };
            await continueExistingSession(sessionData);
        } catch (err) {
            console.error('Error loading in-progress workout:', err);
        } finally {
            setInProgressLoading(false);
        }
    };

    const handleCreateSession = () => {
        if (!sessionName.trim()) return;

        try {
            createFreeformSession(sessionName, sessionDateFreeform);
            setShowSessionModal(false);
        } catch (error) {
            console.error('Error creating session:', error);
        }
    };

    const handleContinueExistingSession = async () => {
        if (!existingSession) {
            return;
        }

        try {
            await continueExistingSession(existingSession);
            setShowExistingSessionModal(false);
        } catch (error) {
            console.error('Error continuing session:', error);
        }
    };

    const handleStartNewSession = () => {
        setShowExistingSessionModal(false);
        setSessionDateFreeform(new Date().toISOString().split('T')[0]);
        setShowSessionModal(true);
    };

    const handleSelectProgramDay = (weekNumber: number, dayName: string, dayExercises: { exerciseId: string; exerciseName: string; sets: number; reps: number[]; alternatives?: string[] }[]) => {
        const program = programForDayPicker ?? activeProgram;
        if (!program || !program.id || !program.name) {
            console.error('Cannot create session: program is invalid', program);
            return;
        }
        const mapped: ProgramDayExercise[] = dayExercises.map((ex) => ({
            exercise_id: ex.exerciseId,
            exercise_name: ex.exerciseName,
            sets: ex.sets,
            reps: ex.reps?.length ? ex.reps : [10, 10, 10],
            alternatives: ex.alternatives || []
        }));
        try {
            createProgramSession(program.id, weekNumber, dayName, mapped, program.weeks.length, program.structure, sessionDateProgram);
        } catch (error) {
            console.error('Error creating program session:', error);
        }
    };

    const handleChangeProgramDay = (weekNumber: number, dayName: string, dayExercises: { exerciseId: string; exerciseName: string; sets: number; reps: number[]; alternatives?: string[] }[]) => {
        const program = programForCurrentSession;
        if (!program || !currentSession) return;

        // Clear current session and create new one with the new day and chosen date
        clearSession();
        createProgramSession(program.id, weekNumber, dayName, dayExercises.map((ex) => ({
            exercise_id: ex.exerciseId,
            exercise_name: ex.exerciseName,
            sets: ex.sets,
            reps: ex.reps?.length ? ex.reps : [10, 10, 10],
            alternatives: ex.alternatives || []
        })), program.weeks.length, program.structure, changeDayModalDate);

        setShowChangeDayModal(false);
    };

    const handleAddExercise = () => {
        if (isMobile) {
            setShowMobileAddExercise(true);
        } else {
            setShowExercisePicker(true);
        }
    };

    const handleMobileAddExercises = () => {
        if (mobileSelectedExerciseIds.size === 0) return;

        // Add all selected exercises with default values (3 sets, 10 reps each, no weight, no notes)
        mobileSelectedExerciseIds.forEach(exerciseId => {
            const exercise = exercises.find(ex => ex.id === exerciseId);
            if (exercise) {
                addExerciseToSession(
                    exercise.id,
                    exercise.name,
                    3, // sets
                    [10, 10, 10], // reps
                    undefined, // weight
                    undefined // notes
                );
            }
        });

        setShowMobileAddExercise(false);
        setMobileSelectedExerciseIds(new Set());
    };

    const handleExerciseSelect = (exercise: any) => {
        setSelectedExercise(exercise);
        setShowExercisePicker(false);
        setExerciseForm({
            reps: [10],
            weight: 0,
            notes: ''
        });
    };

    const handleSaveExercise = () => {
        if (!selectedExercise) return;

        try {
            addExerciseToSession(
                selectedExercise.id,
                selectedExercise.name,
                exerciseForm.reps.length,
                exerciseForm.reps,
                exerciseForm.weight || undefined,
                exerciseForm.notes || undefined
            );
            setSelectedExercise(null);
            setExerciseForm({
                reps: [10],
                weight: 0,
                notes: ''
            });
        } catch (error) {
            console.error('Error adding exercise:', error);
        }
    };

    const handleUpdateExercise = (exerciseId: string, updates: Partial<WorkoutExercise>) => {
        try {
            updateExercise(exerciseId, updates);
        } catch (error) {
            console.error('Error updating exercise:', error);
        }
    };

    const handleRemoveExercise = (exerciseId: string) => {
        try {
            removeExerciseFromSession(exerciseId);
        } catch (error) {
            console.error('Error removing exercise:', error);
        }
    };

    const handleFinishWorkout = async () => {
        if (!currentSession) return;
        setFinishSaveError(null);
        try {
            await saveSession(currentSession);
            clearSession();
            const fromHistory = !!location.state?.editSession;
            navigate(fromHistory ? '/history' : '/');
        } catch (error) {
            console.error('Error finishing workout:', error);
            setFinishSaveError('Save failed. Check your connection and try again.');
        }
    };

    const handleDeleteWorkout = () => {
        setShowDeleteModal(true);
    };

    const confirmDeleteWorkout = async () => {
        if (!currentSession) return;
        try {
            setDeleteLoading(true);
            const sessionId = currentSession.id;
            await supabase.from('workout_logs').delete().eq('session_id', sessionId);
            await supabase.from('workout_sessions').delete().eq('id', sessionId);
            clearSession();
            setShowDeleteModal(false);
            navigate('/history');
        } catch (error) {
            console.error('Error deleting workout:', error);
        } finally {
            setDeleteLoading(false);
        }
    };

    const addRepSet = () => {
        setExerciseForm(prev => ({
            ...prev,
            reps: [...prev.reps, 10]
        }));
    };

    const removeRepSet = (index: number) => {
        setExerciseForm(prev => ({
            ...prev,
            reps: prev.reps.filter((_, i) => i !== index)
        }));
    };

    const updateRep = (index: number, value: number) => {
        setExerciseForm(prev => ({
            ...prev,
            reps: prev.reps.map((rep, i) => i === index ? value : rep)
        }));
    };

    if (loading) {
        return <LoadingScreen message="Loading workout logger..." />;
    }

    if (isProgramFlow && !activeProgram && !currentSession) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center">
                <div className="text-center max-w-md">
                    <p className="text-gray-300 mb-4">You don&apos;t have an active program. Activate one from Programs to log from a program.</p>
                    <div className="flex gap-3 justify-center">
                        <Button onClick={() => navigate('/programs')} variant="primary" icon={<CalendarIcon size={18} />}>
                            Programs
                        </Button>
                        <Button onClick={() => navigate('/')} variant="secondary">
                            Home
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <PageLayout maxWidth="max-w-4xl">
            <PageHeader
                title={location.state?.editSession ? 'Edit Workout' : 'Log Your Workout'}
                subtitle={
                    currentSession ? (
                        <>
                            Session: {currentSession.session_name}
                            {currentSession.session_date && (
                                <span className="text-gray-400 font-normal ml-1">
                                    · {new Date(currentSession.session_date + 'T12:00:00').toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                                </span>
                            )}
                            {currentSession.session_type === 'program' && programForCurrentSession && (
                                <button
                                    onClick={() => {
                                        setChangeDayModalDate(currentSession.session_date ?? new Date().toISOString().split('T')[0]);
                                        setShowChangeDayModal(true);
                                    }}
                                    className="ml-2 text-cyan-400 hover:text-cyan-300 transition text-sm underline"
                                >
                                    Change
                                </button>
                            )}
                        </>
                    ) : (
                        'Create a new workout session'
                    )
                }
                actions={
                    <div className="flex flex-wrap gap-2 sm:gap-3 flex-shrink-0">
                        <Button
                            onClick={async () => {
                                await abandonSession();
                                navigate(location.state?.editSession ? '/history' : '/');
                            }}
                            variant="secondary"
                        >
                            Cancel
                        </Button>
                        {currentSession && location.state?.editSession && (
                            <Button
                                onClick={handleDeleteWorkout}
                                variant="danger"
                                icon={<TrashIcon size={18} />}
                                title="Delete workout"
                            >
                                Delete
                            </Button>
                        )}
                        {finishSaveError && (
                            <p className="w-full text-red-400 text-sm">{finishSaveError}</p>
                        )}
                        {currentSession && (
                            <Button
                                onClick={handleFinishWorkout}
                                variant="success"
                                icon={loading ? undefined : <CheckIcon size={18} />}
                                disabled={currentSession.exercises.length === 0 || loading}
                                title={currentSession.exercises.length === 0 ? 'Add at least one exercise to finish' : ''}
                            >
                                {loading ? 'Saving...' : (location.state?.editSession
                                    ? (location.state?.editSessionInProgress ? 'Finish Workout' : 'Save Changes')
                                    : 'Finish Workout')}
                            </Button>
                        )}
                    </div>
                }
            />

            {/* Existing Session Modal */}
            <Modal
                isOpen={showExistingSessionModal}
                onClose={() => navigate('/')}
                title="Continue Today's Workout?"
                maxWidth="max-w-md"
            >
                <div>
                    <p className="text-gray-300 mb-4">
                        You already have a workout session from today:
                    </p>
                    <div className="bg-gray-700 rounded-lg p-4 mb-6">
                        <div className="font-semibold text-white">
                            {existingSession?.session_name}
                        </div>
                        <div className="text-gray-400 text-sm">
                            {existingSession?.exercises.length} exercises logged
                        </div>
                    </div>
                    <p className="text-gray-300 mb-6">
                        Would you like to continue this session or start a new one?
                    </p>
                    <div className="flex gap-3">
                        <Button
                            onClick={() => navigate('/')}
                            variant="secondary"
                            fullWidth
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleStartNewSession}
                            variant="primary"
                            icon={<PlusIcon size={18} />}
                            fullWidth
                        >
                            New Session
                        </Button>
                        <Button
                            onClick={handleContinueExistingSession}
                            variant="success"
                            icon={<CheckIcon size={18} />}
                            fullWidth
                        >
                            Continue
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Delete Workout Confirmation Modal (when editing from history) */}
            <Modal
                isOpen={showDeleteModal}
                onClose={() => !deleteLoading && setShowDeleteModal(false)}
                title="Delete Workout"
                maxWidth="max-w-md"
            >
                <div>
                    <p className="text-gray-300 mb-4">
                        Are you sure you want to delete this workout? This cannot be undone.
                    </p>
                    {currentSession && (
                        <p className="text-white font-medium mb-6">
                            {currentSession.session_name}
                        </p>
                    )}
                    <div className="flex gap-3">
                        <Button
                            onClick={() => setShowDeleteModal(false)}
                            variant="secondary"
                            fullWidth
                            disabled={deleteLoading}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={confirmDeleteWorkout}
                            variant="danger"
                            icon={<TrashIcon size={18} />}
                            fullWidth
                            disabled={deleteLoading}
                        >
                            {deleteLoading ? 'Deleting...' : 'Delete'}
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Session Creation Modal */}
            <Modal
                isOpen={showSessionModal}
                onClose={() => navigate('/')}
                title="Name Your Workout"
                maxWidth="max-w-md"
            >
                <div>
                    <p className="text-gray-300 mb-4">
                        We've pre-filled a name for your workout session. You can edit it or just click "Start Workout" to begin!
                    </p>
                    <TextInput
                        value={sessionName}
                        onChange={(e) => setSessionName(e.target.value)}
                        placeholder="e.g., Upper Body, Leg Day, Quick Cardio"
                        className="px-4 py-3"
                        onKeyPress={(e) => e.key === 'Enter' && handleCreateSession()}
                        autoFocus
                    />
                    <div className="mt-4 mb-4">
                        <label className="block text-gray-300 text-sm font-medium mb-2">Session date</label>
                        <input
                            type="date"
                            value={sessionDateFreeform}
                            onChange={(e) => setSessionDateFreeform(e.target.value)}
                            className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-gray-200 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                        />
                    </div>
                    <div className="flex gap-3 mt-4">
                        <Button
                            onClick={() => navigate('/')}
                            variant="secondary"
                            fullWidth
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleCreateSession}
                            variant="primary"
                            icon={<PlusIcon size={18} />}
                            disabled={!sessionName.trim()}
                            fullWidth
                        >
                            Start Workout
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Program Day Picker Modal */}
            <Modal
                isOpen={isProgramFlow && !!activeProgram && !currentSession && !loading}
                onClose={() => navigate('/')}
                title={showDifferentProgramList ? 'Log from different program' : `Log workout: ${programForDayPicker?.name ?? activeProgram?.name ?? 'Program'}`}
                maxWidth="max-w-lg"
            >
                <div>
                    {inProgressSession && !showDifferentProgramList && (
                        <div className="mb-4 p-3 bg-cyan-900/30 border border-cyan-700/50 rounded-lg">
                            <p className="text-gray-300 text-sm mb-2">You have a workout in progress.</p>
                            <Button
                                onClick={handleOpenInProgressWorkout}
                                variant="primary"
                                fullWidth
                                disabled={inProgressLoading}
                            >
                                {inProgressLoading ? 'Loading...' : 'Workout in progress'}
                            </Button>
                        </div>
                    )}
                    {showDifferentProgramList ? (
                        <>
                            <p className="text-gray-300 mb-4">Choose a program to log this workout from.</p>
                            <div className="space-y-2 max-h-[50vh] overflow-y-auto">
                                {programs?.map((program) => (
                                    <button
                                        key={program.id}
                                        onClick={() => {
                                            setProgramForDayPicker(program);
                                            setShowDifferentProgramList(false);
                                        }}
                                        className="w-full px-4 py-3 bg-gray-800 hover:bg-gray-700 text-left text-gray-200 rounded-lg transition flex items-center justify-between"
                                    >
                                        <span className="font-medium">{program.name}</span>
                                        {program.id === activeProgram?.id && (
                                            <span className="text-cyan-400 text-sm">(active)</span>
                                        )}
                                    </button>
                                ))}
                            </div>
                            {programs?.length === 0 && (
                                <p className="text-gray-500 text-sm">No programs yet. Create one from Programs.</p>
                            )}
                        </>
                    ) : (
                        <>
                            <div className="mb-4 flex flex-col sm:flex-row sm:items-center gap-2">
                                <label className="text-gray-300 text-sm font-medium shrink-0">Session date</label>
                                <input
                                    type="date"
                                    value={sessionDateProgram}
                                    onChange={(e) => setSessionDateProgram(e.target.value)}
                                    className="px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-gray-200 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                                />
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowDifferentProgramList(true)}
                                className="text-cyan-400 hover:text-cyan-300 text-sm mb-4 underline"
                            >
                                Log from different program
                            </button>
                            <p className="text-gray-300 mb-4">
                                Choose the week and day you're doing.
                            </p>
                            <div className="space-y-4 max-h-[60vh] overflow-y-auto">
                                {programForDayPicker?.weeks.map((week) => (
                                    <div key={week.id} className="bg-gray-800 rounded-lg p-3">
                                        <div className="text-cyan-400 font-semibold mb-2">Week {week.weekNumber}</div>
                                        <div className="flex flex-wrap gap-2">
                                            {week.days.filter((day) => !day.is_rest_day).map((day) => (
                                                <button
                                                    key={day.id}
                                                    onClick={() => handleSelectProgramDay(week.weekNumber, day.name, day.exercises)}
                                                    className="px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition text-sm"
                                                >
                                                    {day.name}
                                                    {day.exercises.length > 0 && (
                                                        <span className="ml-1 text-cyan-200">({day.exercises.length})</span>
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                    <div className="flex gap-3 mt-4">
                        <Button
                            onClick={() => navigate('/')}
                            variant="secondary"
                            fullWidth
                        >
                            Cancel
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Exercise Selector Modal */}
            <Modal
                isOpen={showExercisePicker}
                onClose={() => setShowExercisePicker(false)}
                title="Choose Exercise"
                maxWidth="max-w-6xl"
            >
                <ExerciseSelector
                    onExerciseSelect={handleExerciseSelect}
                    onClose={() => setShowExercisePicker(false)}
                />
            </Modal>

            {/* Exercise Form Modal */}
            <Modal
                isOpen={!!selectedExercise}
                onClose={() => setSelectedExercise(null)}
                title={`Add ${selectedExercise?.name}`}
                maxWidth="max-w-md"
            >
                <div className="space-y-4">
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="block text-gray-300 text-sm font-medium">
                                Reps per Set
                            </label>
                            <span className="text-gray-400 text-sm">
                                Sets: {exerciseForm.reps.length}
                            </span>
                        </div>
                        <div className="space-y-2">
                            {exerciseForm.reps.map((rep, index) => (
                                <div key={index} className="flex flex-col">
                                    <span className="text-gray-400 text-sm mb-1">Set {index + 1}:</span>
                                    <div className="flex gap-2 items-center">
                                        <NumberInput
                                            value={rep}
                                            onChange={(value) => updateRep(index, value)}
                                            min={1}
                                            inputMode="numeric"
                                            className="flex-1 px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:border-cyan-500 focus:outline-none"
                                        />
                                        {exerciseForm.reps.length > 1 && (
                                            <button
                                                onClick={() => removeRepSet(index)}
                                                className="px-2 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                                            >
                                                ×
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                            <button
                                onClick={addRepSet}
                                className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition text-sm"
                            >
                                + Add Set
                            </button>
                        </div>
                    </div>

                    <div>
                        <label className="block text-gray-300 text-sm font-medium mb-2">
                            Weight (kg)
                        </label>
                        <NumberInput
                            value={exerciseForm.weight}
                            onChange={(value) => setExerciseForm(prev => ({ ...prev, weight: value }))}
                            min={0}
                            step={0.5}
                            inputMode="decimal"
                            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:border-cyan-500 focus:outline-none"
                        />
                    </div>

                    <div>
                        <label className="block text-gray-300 text-sm font-medium mb-2">
                            Notes (optional)
                        </label>
                        <TextArea
                            value={exerciseForm.notes}
                            onChange={(e) => setExerciseForm(prev => ({ ...prev, notes: e.target.value }))}
                            rows={3}
                            placeholder="Any notes about this exercise..."
                        />
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button
                            onClick={() => setSelectedExercise(null)}
                            className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSaveExercise}
                            className="flex-1 px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition"
                        >
                            Add Exercise
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Mobile Add Exercise Full-Screen Overlay */}
            <MobileExerciseSelector
                isOpen={isMobile && showMobileAddExercise}
                onClose={() => {
                    setShowMobileAddExercise(false);
                    setMobileSelectedExerciseIds(new Set());
                }}
                title="Add exercises"
                exercises={exercises}
                filteredExercises={filteredExercises}
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                selectedMuscleGroups={selectedMuscleGroups}
                onMuscleGroupChange={setSelectedMuscleGroups}
                muscleGroups={muscleGroups}
                selectedExerciseIds={mobileSelectedExerciseIds}
                onSelectionChange={setMobileSelectedExerciseIds}
                onDone={handleMobileAddExercises}
            />

            {/* Change Day Modal (for program sessions) */}
            <Modal
                isOpen={showChangeDayModal}
                onClose={() => setShowChangeDayModal(false)}
                title="Change Workout Day"
                maxWidth="max-w-lg"
            >
                <div>
                    <div className="mb-4 flex flex-col sm:flex-row sm:items-center gap-2">
                        <label className="text-gray-300 text-sm font-medium shrink-0">Session date</label>
                        <input
                            type="date"
                            value={changeDayModalDate}
                            onChange={(e) => setChangeDayModalDate(e.target.value)}
                            className="px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-gray-200 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                        />
                    </div>
                    <p className="text-gray-300 mb-4">
                        Select a different day. This will replace your current exercises.
                    </p>
                    <div className="space-y-4 max-h-[60vh] overflow-y-auto">
                        {programForCurrentSession?.weeks.map((week) => (
                            <div key={week.id} className="bg-gray-800 rounded-lg p-3">
                                <div className="text-cyan-400 font-semibold mb-2">Week {week.weekNumber}</div>
                                <div className="flex flex-wrap gap-2">
                                    {week.days.filter((day) => !day.is_rest_day).map((day) => (
                                        <button
                                            key={day.id}
                                            onClick={() => handleChangeProgramDay(week.weekNumber, day.name, day.exercises)}
                                            className={`px-4 py-2 rounded-lg transition text-sm ${currentSession?.week_number === week.weekNumber && currentSession?.day_name === day.name
                                                ? 'bg-cyan-700 text-white ring-2 ring-cyan-400'
                                                : 'bg-cyan-600 text-white hover:bg-cyan-700'
                                                }`}
                                        >
                                            {day.name}
                                            {day.exercises.length > 0 && (
                                                <span className="ml-1 text-cyan-200">({day.exercises.length})</span>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="flex flex-wrap gap-3 mt-4">
                        <button
                            onClick={() => setShowChangeDayModal(false)}
                            className="flex-1 min-w-[100px] px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={() => {
                                updateSessionDate(changeDayModalDate);
                                setShowChangeDayModal(false);
                            }}
                            className="flex-1 min-w-[100px] px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition"
                        >
                            Update date only
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Main Content */}
            {currentSession ? (
                <div>
                    {/* Add Exercise Button */}
                    <div className="mb-6">
                        <Button
                            onClick={handleAddExercise}
                            variant="primary"
                            icon={<PlusIcon size={18} />}
                            className="px-6 py-3 font-semibold"
                        >
                            Add Exercise
                        </Button>
                    </div>

                    {/* Exercises List */}
                    <div className="space-y-4">
                        {currentSession.exercises.length === 0 ? (
                            <div className="text-center py-12">
                                <div className="text-gray-400 text-lg mb-4">
                                    No exercises added yet
                                </div>
                                <p className="text-gray-500">
                                    Click "Add Exercise" to start logging your workout
                                </p>
                            </div>
                        ) : (
                            currentSession.exercises.map((exercise) => (
                                <div key={exercise.id} className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex-1">
                                            <h3 className="text-xl font-bold text-white">{exercise.exercise_name}</h3>
                                            {exercise.original_exercise_name && (
                                                <p className="text-gray-400 text-sm mt-1">
                                                    Swapped from: {exercise.original_exercise_name}
                                                </p>
                                            )}
                                        </div>
                                        <div className="flex gap-2">
                                            <ExerciseHistoryButton
                                                exerciseId={exercise.exercise_id}
                                                exerciseName={exercise.exercise_name}
                                                variant="icon"
                                                programId={currentSession?.session_type === 'program' ? currentSession.program_id : undefined}
                                                programName={currentSession?.session_type === 'program' && programForCurrentSession ? programForCurrentSession.name : undefined}
                                                dayName={currentSession?.day_name}
                                            />
                                            <button
                                                onClick={() => handleRemoveExercise(exercise.id)}
                                                className="px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm"
                                            >
                                                Remove
                                            </button>
                                        </div>
                                    </div>

                                    {/* Alternatives */}
                                    {exercise.alternatives && exercise.alternatives.length > 0 && (
                                        <div className="mb-4">
                                            <label className="block text-gray-400 text-sm mb-2">Alternatives:</label>
                                            <div className="flex flex-wrap gap-2">
                                                {/* Show original exercise if swapped */}
                                                {exercise.original_exercise_name && (
                                                    <button
                                                        onClick={() => swapExerciseAlternative(exercise.id, exercise.original_exercise_name!)}
                                                        className="px-3 py-2 bg-gray-600/20 border border-gray-500/50 text-gray-300 rounded-lg hover:bg-gray-600/30 transition text-sm"
                                                    >
                                                        Swap back to {exercise.original_exercise_name}
                                                    </button>
                                                )}
                                                {/* Show alternatives (excluding current exercise) */}
                                                {exercise.alternatives
                                                    .filter(alt => alt !== exercise.exercise_name)
                                                    .map((alt, index) => (
                                                        <button
                                                            key={index}
                                                            onClick={() => swapExerciseAlternative(exercise.id, alt)}
                                                            className="px-3 py-2 bg-cyan-600/20 border border-cyan-500/50 text-cyan-300 rounded-lg hover:bg-cyan-600/30 transition text-sm"
                                                        >
                                                            Swap to {alt}
                                                        </button>
                                                    ))}
                                            </div>
                                        </div>
                                    )}

                                    <div>
                                        <label className="block text-gray-400 text-sm mb-1">Notes</label>
                                        <TextInput
                                            variant="auth"
                                            value={exercise.notes || ''}
                                            onChange={(e) => handleUpdateExercise(exercise.id, { notes: e.target.value })}
                                            className="px-3 py-2"
                                            placeholder="Optional notes..."
                                        />
                                    </div>

                                    <div className="mt-4">
                                        <div className="text-gray-400 text-xs mb-1">0 = bodyweight</div>
                                        <div className="overflow-x-auto">
                                            <table className="w-full min-w-[280px]">
                                                <thead>
                                                    <tr className="border-b border-gray-600">
                                                        <th className="text-left text-cyan-400/90 text-xs font-medium py-2 pr-3 w-0 whitespace-nowrap">Last</th>
                                                        <th className="text-left text-cyan-400 text-sm font-medium py-2 pr-3">Weight (kg)</th>
                                                        <th className="text-left text-cyan-400 text-sm font-medium py-2 pr-3">Reps</th>
                                                        <th className="w-8"></th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {(() => {
                                                        const prevLog = previousLifts[exercise.exercise_id];
                                                        const prevSetCount = prevLog?.reps_per_set?.length ?? 0;
                                                        const rowCount = Math.max(exercise.reps.length, prevSetCount);
                                                        return Array.from({ length: rowCount }, (_, repIndex) => {
                                                            const prevSet = formatPreviousSet(prevLog, repIndex);
                                                            const isCurrentSet = repIndex < exercise.reps.length;
                                                            return (
                                                                <tr key={repIndex} className="border-b border-gray-700/50">
                                                                    <td className="py-1.5 pr-3 text-gray-400 text-xs align-middle w-0 whitespace-nowrap">
                                                                        {prevSet ?? '—'}
                                                                    </td>
                                                                    <td className="py-1.5 pr-3">
                                                                        {isCurrentSet ? (
                                                                            <NumberInput
                                                                                value={exercise.weight_per_set?.[repIndex] ?? exercise.weight ?? 0}
                                                                                onChange={(value) => {
                                                                                    const prev = exercise.weight_per_set ?? [];
                                                                                    const next = [...prev];
                                                                                    while (next.length <= repIndex) next.push(undefined);
                                                                                    next[repIndex] = value;
                                                                                    handleUpdateExercise(exercise.id, { weight_per_set: next });
                                                                                }}
                                                                                min={0}
                                                                                step={0.5}
                                                                                inputMode="decimal"
                                                                                className="w-16 px-2 py-1.5 bg-gray-700 border border-gray-600 rounded text-white text-center focus:border-cyan-500 focus:outline-none"
                                                                            />
                                                                        ) : (
                                                                            <span className="text-gray-500 text-xs">—</span>
                                                                        )}
                                                                    </td>
                                                                    <td className="py-1.5 pr-3">
                                                                        {isCurrentSet ? (
                                                                            <NumberInput
                                                                                value={exercise.reps[repIndex]}
                                                                                onChange={(value) => {
                                                                                    const newReps = [...exercise.reps];
                                                                                    newReps[repIndex] = value;
                                                                                    handleUpdateExercise(exercise.id, { reps: newReps });
                                                                                }}
                                                                                min={1}
                                                                                inputMode="numeric"
                                                                                className="w-16 px-2 py-1.5 bg-gray-700 border border-gray-600 rounded text-white text-center focus:border-cyan-500 focus:outline-none"
                                                                            />
                                                                        ) : (
                                                                            <span className="text-gray-500 text-xs">—</span>
                                                                        )}
                                                                    </td>
                                                                    <td className="py-1.5">
                                                                        {isCurrentSet && exercise.reps.length > 1 ? (
                                                                            <button
                                                                                onClick={() => {
                                                                                    const newReps = exercise.reps.filter((_, i) => i !== repIndex);
                                                                                    const newWeights = (exercise.weight_per_set ?? []).filter((_, i) => i !== repIndex);
                                                                                    handleUpdateExercise(exercise.id, { reps: newReps, sets: newReps.length, weight_per_set: newWeights.length ? newWeights : undefined });
                                                                                }}
                                                                                className="text-gray-500 hover:text-red-400 transition text-lg leading-none p-0.5"
                                                                                title="Remove set"
                                                                            >
                                                                                ×
                                                                            </button>
                                                                        ) : null}
                                                                    </td>
                                                                </tr>
                                                            );
                                                        });
                                                    })()}
                                                </tbody>
                                            </table>
                                        </div>
                                        <button
                                            onClick={() => {
                                                const lastRep = exercise.reps[exercise.reps.length - 1] || 10;
                                                const newReps = [...exercise.reps, lastRep];
                                                handleUpdateExercise(exercise.id, { reps: newReps, sets: newReps.length });
                                            }}
                                            className="mt-2 flex items-center gap-1.5 text-cyan-400 hover:text-cyan-300 text-sm font-medium transition"
                                            title="Add set"
                                        >
                                            <span className="w-6 h-6 rounded bg-cyan-600/30 flex items-center justify-center text-lg">+</span>
                                            Add set
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            ) : (
                <div className="text-center py-12">
                    <div className="text-gray-400 text-lg">
                        Create a workout session to start logging
                    </div>
                </div>
            )}
        </PageLayout>
    );
}
