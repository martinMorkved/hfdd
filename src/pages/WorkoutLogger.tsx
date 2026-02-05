import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useWorkoutLogging, type WorkoutExercise, type ProgramDayExercise } from '../features/workouts/useWorkoutLogging';
import { useWorkoutProgram } from '../features/programs/useWorkoutProgram';
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
import { PlusIcon, CheckIcon, CalendarIcon } from '../components/icons';

export default function WorkoutLogger() {
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth();
    const { activeProgram } = useWorkoutProgram();
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
        swapExerciseAlternative
    } = useWorkoutLogging();

    const isProgramFlow = location.state?.sessionType === 'program';

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

    // Validate that program sessions match the active program
    // Only validate if we're not editing a session from history
    useEffect(() => {
        // Don't validate if we're editing a session from history
        if (location.state?.editSession) return;

        // Only validate if we have a current session
        if (!currentSession || currentSession.session_type !== 'program') return;

        if (activeProgram) {
            // If the session's program_id doesn't match the active program, clear it
            if (currentSession.program_id !== activeProgram.id) {
                clearSession();
            }
        } else {
            // If there's a program session but no active program, clear it
            clearSession();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentSession?.id, currentSession?.program_id, activeProgram?.id, location.state?.editSession]);

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

    // Auto-create session modal for freeform only; program flow uses program day picker
    useEffect(() => {
        if (isProgramFlow) return;
        if (!currentSession && !existingSession && !showSessionModal && !showExistingSessionModal && !location.state?.editSession) {
            setShowSessionModal(true);
        } else if (existingSession && showSessionModal) {
            setShowSessionModal(false);
        }
    }, [isProgramFlow, currentSession, existingSession, showSessionModal, showExistingSessionModal, location.state]);

    const handleCreateSession = () => {
        if (!sessionName.trim()) return;

        try {
            createFreeformSession(sessionName);
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
        setShowSessionModal(true);
    };

    const handleSelectProgramDay = (weekNumber: number, dayName: string, dayExercises: { exerciseId: string; exerciseName: string; sets: number; reps: number[]; alternatives?: string[] }[]) => {
        if (!activeProgram || !activeProgram.id || !activeProgram.name) {
            console.error('Cannot create session: active program is invalid', activeProgram);
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
            createProgramSession(activeProgram.id, activeProgram.name, weekNumber, dayName, mapped);
        } catch (error) {
            console.error('Error creating program session:', error);
        }
    };

    const handleChangeProgramDay = (weekNumber: number, dayName: string, dayExercises: { exerciseId: string; exerciseName: string; sets: number; reps: number[]; alternatives?: string[] }[]) => {
        if (!activeProgram || !currentSession) return;

        // Clear current session and create new one with the new day
        clearSession();
        createProgramSession(activeProgram.id, activeProgram.name, weekNumber, dayName, dayExercises.map((ex) => ({
            exercise_id: ex.exerciseId,
            exercise_name: ex.exerciseName,
            sets: ex.sets,
            reps: ex.reps?.length ? ex.reps : [10, 10, 10],
            alternatives: ex.alternatives || []
        })));

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
        try {
            await saveSession();
            clearSession();
            navigate('/');
        } catch (error) {
            console.error('Error finishing workout:', error);
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
                            {currentSession.session_type === 'program' && activeProgram && (
                                <button
                                    onClick={() => setShowChangeDayModal(true)}
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
                    <div className="flex gap-3 flex-shrink-0">
                        <Button
                            onClick={() => {
                                clearSession();
                                navigate('/');
                            }}
                            variant="secondary"
                        >
                            Cancel
                        </Button>
                        {currentSession && (
                            <Button
                                onClick={handleFinishWorkout}
                                variant="success"
                                icon={<CheckIcon size={18} />}
                                disabled={currentSession.exercises.length === 0}
                                title={currentSession.exercises.length === 0 ? 'Add at least one exercise to finish' : ''}
                            >
                                {location.state?.editSession ? 'Save Changes' : 'Finish Workout'}
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
                title={`Log workout: ${activeProgram?.name ?? 'Program'}`}
                maxWidth="max-w-lg"
            >
                <div>
                    <p className="text-gray-300 mb-4">
                        Choose the week and day you're doing today.
                    </p>
                    <div className="space-y-4 max-h-[60vh] overflow-y-auto">
                        {activeProgram?.weeks.map((week) => (
                            <div key={week.id} className="bg-gray-800 rounded-lg p-3">
                                <div className="text-cyan-400 font-semibold mb-2">Week {week.weekNumber}</div>
                                <div className="flex flex-wrap gap-2">
                                    {week.days.map((day) => (
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
                    <p className="text-gray-300 mb-4">
                        Select a different day. This will replace your current exercises.
                    </p>
                    <div className="space-y-4 max-h-[60vh] overflow-y-auto">
                        {activeProgram?.weeks.map((week) => (
                            <div key={week.id} className="bg-gray-800 rounded-lg p-3">
                                <div className="text-cyan-400 font-semibold mb-2">Week {week.weekNumber}</div>
                                <div className="flex flex-wrap gap-2">
                                    {week.days.map((day) => (
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
                    <div className="flex gap-3 mt-4">
                        <button
                            onClick={() => setShowChangeDayModal(false)}
                            className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition"
                        >
                            Cancel
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

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-gray-400 text-sm mb-1">Weight (kg)</label>
                                            <NumberInput
                                                value={exercise.weight || 0}
                                                onChange={(value) => handleUpdateExercise(exercise.id, { weight: value })}
                                                min={0}
                                                step={0.5}
                                                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-cyan-500 focus:outline-none"
                                            />
                                        </div>
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
                                    </div>

                                    <div className="mt-4">
                                        <div className="flex gap-2 flex-wrap items-end">
                                            {exercise.reps.map((rep, repIndex) => (
                                                <div key={repIndex} className="flex flex-col">
                                                    <span className="text-gray-400 text-sm mb-1">Set {repIndex + 1}:</span>
                                                    <div className="flex items-center gap-1">
                                                        <NumberInput
                                                            value={rep}
                                                            onChange={(value) => {
                                                                const newReps = [...exercise.reps];
                                                                newReps[repIndex] = value;
                                                                handleUpdateExercise(exercise.id, { reps: newReps });
                                                            }}
                                                            min={1}
                                                            className="w-16 px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-center focus:border-cyan-500 focus:outline-none"
                                                        />
                                                        {exercise.reps.length > 1 && (
                                                            <button
                                                                onClick={() => {
                                                                    const newReps = exercise.reps.filter((_, i) => i !== repIndex);
                                                                    handleUpdateExercise(exercise.id, { reps: newReps, sets: newReps.length });
                                                                }}
                                                                className="text-gray-500 hover:text-red-400 transition text-lg leading-none"
                                                                title="Remove set"
                                                            >
                                                                ×
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                            <button
                                                onClick={() => {
                                                    const lastRep = exercise.reps[exercise.reps.length - 1] || 10;
                                                    const newReps = [...exercise.reps, lastRep];
                                                    handleUpdateExercise(exercise.id, { reps: newReps, sets: newReps.length });
                                                }}
                                                className="w-10 h-8 bg-cyan-600 text-white rounded hover:bg-cyan-700 transition text-xl font-bold flex items-center justify-center"
                                                title="Add set"
                                            >
                                                +
                                            </button>
                                        </div>
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
