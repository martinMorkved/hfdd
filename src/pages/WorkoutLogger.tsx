import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useWorkoutLogging, type WorkoutExercise, type ProgramDayExercise } from '../hooks/useWorkoutLogging';
import { useWorkoutProgram } from '../hooks/useWorkoutProgram';
import { Modal } from '../components/Modal';
import { NumberInput } from '../components/NumberInput';
import { useAuth } from '../contexts/AuthContext';
import { ExerciseSelector } from '../components/ExerciseSelector';
import { ExerciseHistoryButton } from '../components/ExerciseHistoryButton';

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
        clearSession
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

    const handleSelectProgramDay = (weekNumber: number, dayName: string, dayExercises: { exerciseId: string; exerciseName: string; sets: number; reps: number[] }[]) => {
        if (!activeProgram) return;
        const mapped: ProgramDayExercise[] = dayExercises.map((ex) => ({
            exercise_id: ex.exerciseId,
            exercise_name: ex.exerciseName,
            sets: ex.sets,
            reps: ex.reps?.length ? ex.reps : [10, 10, 10]
        }));
        try {
            createProgramSession(activeProgram.id, activeProgram.name, weekNumber, dayName, mapped);
        } catch (error) {
            console.error('Error creating program session:', error);
        }
    };

    const handleChangeProgramDay = (weekNumber: number, dayName: string, dayExercises: { exerciseId: string; exerciseName: string; sets: number; reps: number[] }[]) => {
        if (!activeProgram || !currentSession) return;
        
        // Clear current session and create new one with the new day
        clearSession();
        createProgramSession(activeProgram.id, activeProgram.name, weekNumber, dayName, dayExercises.map((ex) => ({
            exercise_id: ex.exerciseId,
            exercise_name: ex.exerciseName,
            sets: ex.sets,
            reps: ex.reps?.length ? ex.reps : [10, 10, 10]
        })));
        
        setShowChangeDayModal(false);
    };

    const handleAddExercise = () => {
        setShowExercisePicker(true);
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
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center">
                <div className="text-white text-xl">Loading workout logger...</div>
            </div>
        );
    }

    if (isProgramFlow && !activeProgram && !currentSession) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center">
                <div className="text-center max-w-md">
                    <p className="text-gray-300 mb-4">You don&apos;t have an active program. Activate one from Programs to log from a program.</p>
                    <div className="flex gap-3 justify-center">
                        <button onClick={() => navigate('/programs')} className="px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition">
                            Programs
                        </button>
                        <button onClick={() => navigate('/')} className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition">
                            Home
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-900">
            <div className="p-8">
                <div className="max-w-4xl mx-auto">
                    {/* Header */}
                    <div className="mb-8 flex items-start justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-white mb-2">
                                {location.state?.editSession ? 'Edit Workout' : 'Log Your Workout'}
                            </h1>
                            <p className="text-gray-400">
                                {currentSession ? (
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
                                ) : 'Create a new workout session'}
                            </p>
                        </div>
                        <div className="flex gap-3 flex-shrink-0">
                                <button
                                    onClick={() => navigate('/')}
                                    className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition"
                                >
                                    Cancel
                                </button>
                                {currentSession && (
                                    <button
                                        onClick={handleFinishWorkout}
                                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                                    >
                                        {location.state?.editSession ? 'Save Changes' : 'Finish Workout'}
                                    </button>
                                )}
                        </div>
                    </div>

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
                                <button
                                    onClick={() => navigate('/')}
                                    className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleStartNewSession}
                                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                                >
                                    New Session
                                </button>
                                <button
                                    onClick={handleContinueExistingSession}
                                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                                >
                                    Continue
                                </button>
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
                            <input
                                type="text"
                                value={sessionName}
                                onChange={(e) => setSessionName(e.target.value)}
                                placeholder="e.g., Upper Body, Leg Day, Quick Cardio"
                                className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-cyan-500 focus:outline-none"
                                onKeyPress={(e) => e.key === 'Enter' && handleCreateSession()}
                                autoFocus
                            />
                            <div className="flex gap-3 mt-4">
                                <button
                                    onClick={() => navigate('/')}
                                    className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleCreateSession}
                                    disabled={!sessionName.trim()}
                                    className="flex-1 px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition disabled:bg-gray-600 disabled:cursor-not-allowed"
                                >
                                    Start Workout
                                </button>
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
                                <button
                                    onClick={() => navigate('/')}
                                    className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition"
                                >
                                    Cancel
                                </button>
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
                                <textarea
                                    value={exerciseForm.notes}
                                    onChange={(e) => setExerciseForm(prev => ({ ...prev, notes: e.target.value }))}
                                    className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:border-cyan-500 focus:outline-none"
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
                                                    className={`px-4 py-2 rounded-lg transition text-sm ${
                                                        currentSession?.week_number === week.weekNumber && currentSession?.day_name === day.name
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
                                <button
                                    onClick={handleAddExercise}
                                    className="px-6 py-3 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition font-semibold flex items-center gap-2"
                                >
                                    <span>➕</span>
                                    Add Exercise
                                </button>
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
                                                <h3 className="text-xl font-bold text-white">{exercise.exercise_name}</h3>
                                                <div className="flex gap-2">
                                                    <ExerciseHistoryButton
                                                        exerciseId={exercise.exercise_id}
                                                        exerciseName={exercise.exercise_name}
                                                        variant="icon"
                                                    />
                                                    <button
                                                        onClick={() => handleRemoveExercise(exercise.exercise_id)}
                                                        className="px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm"
                                                    >
                                                        Remove
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                <div>
                                                    <label className="block text-gray-400 text-sm mb-1">Sets</label>
                                                    <NumberInput
                                                        value={exercise.sets}
                                                        onChange={(value) => handleUpdateExercise(exercise.exercise_id, { sets: value })}
                                                        min={1}
                                                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-cyan-500 focus:outline-none"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-gray-400 text-sm mb-1">Weight (kg)</label>
                                                    <NumberInput
                                                        value={exercise.weight || 0}
                                                        onChange={(value) => handleUpdateExercise(exercise.exercise_id, { weight: value })}
                                                        min={0}
                                                        step={0.5}
                                                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-cyan-500 focus:outline-none"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-gray-400 text-sm mb-1">Notes</label>
                                                    <input
                                                        type="text"
                                                        value={exercise.notes || ''}
                                                        onChange={(e) => handleUpdateExercise(exercise.exercise_id, { notes: e.target.value })}
                                                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-cyan-500 focus:outline-none"
                                                        placeholder="Optional notes..."
                                                    />
                                                </div>
                                            </div>

                                            <div className="mt-4">
                                                <label className="block text-gray-400 text-sm mb-2">Reps per Set</label>
                                                <div className="flex gap-2 flex-wrap">
                                                    {exercise.reps.map((rep, repIndex) => (
                                                        <div key={repIndex} className="flex flex-col">
                                                            <span className="text-gray-400 text-sm mb-1">Set {repIndex + 1}:</span>
                                                            <NumberInput
                                                                value={rep}
                                                                onChange={(value) => {
                                                                    const newReps = [...exercise.reps];
                                                                    newReps[repIndex] = value;
                                                                    handleUpdateExercise(exercise.exercise_id, { reps: newReps });
                                                                }}
                                                                min={1}
                                                                className="w-16 px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-center focus:border-cyan-500 focus:outline-none"
                                                            />
                                                        </div>
                                                    ))}
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
                </div>
            </div>
        </div>
    );
}
