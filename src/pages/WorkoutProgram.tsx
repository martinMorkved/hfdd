import { useState } from "react";
import { MultiSelectFilter } from "../components/MultiSelectFilterProps";

// Exercise type from Supabase
type Exercise = {
    id: string;
    name: string;
    description?: string;
    muscle_group?: string;
    created_at?: string;
    updated_at?: string;
};
import { useWorkoutProgram, type ProgramStructure } from "../hooks/useWorkoutProgram";
import { useExerciseManagement } from "../hooks/useExerciseManagement";
import { useDragAndDrop } from "../hooks/useDragAndDrop";
import { ExerciseSidebar } from "../components/WorkoutProgram/ExerciseSidebar";

// Use shared exercise data (pretend database)
const exercises: Exercise[] = [];

export default function WorkoutProgram() {
    // Use custom hooks for state management
    const {
        programs,
        currentProgram,
        setCurrentProgram,
        programName,
        setProgramName,
        programDescription,
        setProgramDescription,
        programStructure,
        setProgramStructure,
        createNewProgram,
        updateProgramInArray,
        selectProgram
    } = useWorkoutProgram();

    const {
        selectedMuscleGroups,
        setSelectedMuscleGroups,
        searchTerm,
        setSearchTerm,
        addExerciseToDay,
        updateExerciseSets,
        updateExerciseRep,
        updateExerciseComment,
        updateExerciseAlternatives,
        removeExerciseFromDay
    } = useExerciseManagement(currentProgram, setCurrentProgram, updateProgramInArray);

    const {
        dragOverDay,
        showRemoveZone,
        handleDragStart,
        handleDragOver,
        handleDragLeave,
        handleWorkoutExerciseDragStart,
        handleRemoveZoneDragOver,
        handleRemoveZoneDrop,
        handleDrop
    } = useDragAndDrop(addExerciseToDay, removeExerciseFromDay);

    // Local state for modals and UI
    const [showWeekCopyPrompt, setShowWeekCopyPrompt] = useState(false);
    const [weekToCopy, setWeekToCopy] = useState<number | null>(null);
    const [showAlternativesModal, setShowAlternativesModal] = useState(false);
    const [selectedExerciseForAlternatives, setSelectedExerciseForAlternatives] = useState<{ weekNumber: number, dayName: string, exerciseId: string } | null>(null);
    const [showExerciseSidebar, setShowExerciseSidebar] = useState(true);

    // Get unique muscle groups
    const muscleGroups = Array.from(new Set(exercises.map(ex => ex.muscle_group).filter(Boolean))) as string[];

    // Filter exercises by search term and selected muscle groups
    const filteredExercises = exercises.filter(ex => {
        const matchesSearch = searchTerm === "" ||
            ex.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (ex.description && ex.description.toLowerCase().includes(searchTerm.toLowerCase()));

        const matchesMuscleGroup = selectedMuscleGroups.length === 0 ||
            (ex.muscle_group && selectedMuscleGroups.includes(ex.muscle_group));

        return matchesSearch && matchesMuscleGroup;
    });

    const openAlternativesModal = (weekNumber: number, dayName: string, exerciseId: string) => {
        setSelectedExerciseForAlternatives({ weekNumber, dayName, exerciseId });
        setShowAlternativesModal(true);
    };

    const addWeek = () => {
        if (!currentProgram) return;

        // Don't allow adding weeks for frequency-based programs
        if (currentProgram.structure === "frequency") return;

        if (currentProgram.weeks.length >= 1) {
            // Show prompt to copy from existing week (when adding Week 2 or later)
            setShowWeekCopyPrompt(true);
        }
    };

    const addEmptyWeek = () => {
        if (!currentProgram) return;

        const updatedProgram = { ...currentProgram };
        const newWeekNumber = updatedProgram.weeks.length + 1;

        let newDays: { id: string; name: string; exercises: any[] }[] = [];

        if (currentProgram.structure === "weekly") {
            newDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map(day => ({
                id: day.toLowerCase(),
                name: day,
                exercises: []
            }));
        } else if (currentProgram.structure === "rotating") {
            newDays = ["Day A", "Day B", "Day C"].map(day => ({
                id: day.toLowerCase().replace(" ", ""),
                name: day,
                exercises: []
            }));
        } else if (currentProgram.structure === "block") {
            newDays = ["Block 1", "Block 2", "Block 3", "Block 4"].map(day => ({
                id: day.toLowerCase().replace(" ", ""),
                name: day,
                exercises: []
            }));
        } else if (currentProgram.structure === "frequency") {
            newDays = ["Full Body"].map(day => ({
                id: day.toLowerCase().replace(" ", ""),
                name: day,
                exercises: []
            }));
        }

        const newWeek = {
            weekNumber: newWeekNumber,
            days: newDays
        };

        updatedProgram.weeks.push(newWeek);
        setCurrentProgram(updatedProgram);
        updateProgramInArray(updatedProgram);
        setShowWeekCopyPrompt(false);
        setWeekToCopy(null);
    };

    const addWeekWithCopy = (weekNumber: number) => {
        if (!currentProgram) return;

        const updatedProgram = { ...currentProgram };
        const newWeekNumber = updatedProgram.weeks.length + 1;
        const weekToCopyFrom = updatedProgram.weeks.find(w => w.weekNumber === weekNumber);

        if (weekToCopyFrom) {
            const newWeek = {
                weekNumber: newWeekNumber,
                days: weekToCopyFrom.days.map(day => ({
                    ...day,
                    exercises: day.exercises.map(exercise => ({
                        ...exercise,
                        exerciseId: `${exercise.exerciseId}_${newWeekNumber}`, // Make unique ID
                        reps: [...exercise.reps] // Copy the reps array
                    }))
                }))
            };

            updatedProgram.weeks.push(newWeek);
            setCurrentProgram(updatedProgram);
            updateProgramInArray(updatedProgram);
        }

        setShowWeekCopyPrompt(false);
        setWeekToCopy(null);
    };

    const getStructureLabel = (structure: ProgramStructure) => {
        switch (structure) {
            case "weekly": return "Weekly (7-day cycles)";
            case "rotating": return "Rotating (A/B/C days)";
            case "block": return "Block-based (Mesocycles)";
            case "frequency": return "Frequency-based (Full body)";
            default: return structure;
        }
    };

    const getWeekLabel = (structure: ProgramStructure, weekNumber: number) => {
        switch (structure) {
            case "weekly": return `Week ${weekNumber}`;
            case "rotating": return `Cycle ${weekNumber}`;
            case "block": return `Block ${weekNumber}`;
            case "frequency": return `Template`; // Single template, no week numbers
            default: return `Week ${weekNumber}`;
        }
    };

    const shouldShowAddWeekButton = (structure: ProgramStructure) => {
        return structure !== "frequency"; // Don't show add week for frequency-based programs
    };

    const getAddWeekButtonText = (structure: ProgramStructure) => {
        switch (structure) {
            case "weekly": return "Add Week";
            case "rotating": return "Add Cycle";
            case "block": return "Add Block";
            case "frequency": return "Add Week"; // This shouldn't be shown
            default: return "Add Week";
        }
    };

    return (
        <div className="min-h-screen bg-gray-900">
            <div className="flex h-screen">
                {/* Exercise Sidebar */}
                <ExerciseSidebar
                    showExerciseSidebar={showExerciseSidebar}
                    setShowExerciseSidebar={setShowExerciseSidebar}
                    exercises={exercises}
                    filteredExercises={filteredExercises}
                    muscleGroups={muscleGroups}
                    selectedMuscleGroups={selectedMuscleGroups}
                    setSelectedMuscleGroups={setSelectedMuscleGroups}
                    searchTerm={searchTerm}
                    setSearchTerm={setSearchTerm}
                    onDragStart={handleDragStart}
                />

                {/* Main Content */}
                <div className="flex-1 overflow-y-auto relative">
                    <div className="p-8">
                        <div className="max-w-[1100px] mx-auto">
                            <div className="flex items-center justify-between mb-8">
                                <h2 className="text-3xl font-bold text-white">Workout Program Builder</h2>
                                <button
                                    onClick={() => setShowExerciseSidebar(!showExerciseSidebar)}
                                    className="px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition font-semibold"
                                >
                                    {showExerciseSidebar ? 'Hide' : 'Show'} Exercise Library
                                </button>
                            </div>

                            {/* Program Selection/Creation */}
                            <div className="mb-8">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                    <input
                                        type="text"
                                        placeholder="Program name"
                                        value={programName}
                                        onChange={(e) => setProgramName(e.target.value)}
                                        className="border border-gray-400 rounded-lg px-4 py-2 bg-gray-900 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 placeholder-gray-400"
                                    />
                                    <input
                                        type="text"
                                        placeholder="Description"
                                        value={programDescription}
                                        onChange={(e) => setProgramDescription(e.target.value)}
                                        className="border border-gray-400 rounded-lg px-4 py-2 bg-gray-900 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 placeholder-gray-400"
                                    />
                                    <select
                                        value={programStructure}
                                        onChange={(e) => setProgramStructure(e.target.value as ProgramStructure)}
                                        className="border border-gray-400 rounded-lg px-4 py-2 bg-gray-900 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                    >
                                        <option value="weekly">Weekly (7-day cycles)</option>
                                        <option value="rotating">Rotating (A/B/C days)</option>
                                        <option value="block">Block-based (Mesocycles)</option>
                                        <option value="frequency">Single Template (Full body)</option>
                                    </select>
                                </div>
                                <div className="flex justify-center">
                                    <button
                                        onClick={createNewProgram}
                                        className="px-8 py-3 bg-cyan-600 text-white rounded-lg border border-cyan-500 hover:bg-cyan-700 transition font-semibold text-lg"
                                    >
                                        Create Program
                                    </button>
                                </div>

                                {/* Program List */}
                                {programs.length > 0 && (
                                    <div className="mb-4">
                                        <h3 className="text-lg font-semibold text-white mb-2">Select Program:</h3>
                                        <div className="flex gap-2 flex-wrap">
                                            {programs.map(program => (
                                                <button
                                                    key={program.id}
                                                    onClick={() => selectProgram(program)}
                                                    className={`px-4 py-2 rounded-lg border transition ${currentProgram?.id === program.id
                                                        ? "bg-cyan-600 text-white border-cyan-500"
                                                        : "bg-gray-800 text-gray-300 border-gray-600 hover:bg-gray-700"
                                                        }`}
                                                >
                                                    {program.name}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Current Program Display */}
                            {currentProgram && (
                                <div className="space-y-6">
                                    <div className="text-center">
                                        <h3 className="text-2xl font-bold text-white mb-2">{currentProgram.name}</h3>
                                        {currentProgram.description && (
                                            <p className="text-gray-300 mb-2">{currentProgram.description}</p>
                                        )}
                                        <p className="text-cyan-400 text-sm font-medium">{getStructureLabel(currentProgram.structure)}</p>
                                    </div>

                                    {/* Weeks */}
                                    <div className="space-y-8">
                                        {currentProgram.weeks.map(week => (
                                            <div key={week.weekNumber} className="space-y-4">
                                                <div className="flex items-center justify-between">
                                                    <h3 className="text-xl font-bold text-cyan-400">{getWeekLabel(currentProgram.structure, week.weekNumber)}</h3>
                                                </div>

                                                {/* Days */}
                                                <div className="space-y-6">
                                                    {week.days.map(day => (
                                                        <div
                                                            key={day.id}
                                                            className={`rounded-lg p-6 border transition-colors ${dragOverDay?.weekNumber === week.weekNumber && dragOverDay?.dayName === day.name
                                                                ? 'bg-cyan-900 border-cyan-500 shadow-lg shadow-cyan-500/20'
                                                                : 'bg-gray-800 border-gray-700'
                                                                }`}
                                                            onDragOver={(e) => handleDragOver(e, week.weekNumber, day.name)}
                                                            onDragLeave={handleDragLeave}
                                                            onDrop={() => handleDrop(week.weekNumber, day.name)}
                                                        >
                                                            <div className="flex items-center justify-between mb-6">
                                                                <h4 className="text-xl font-semibold text-white">{day.name}</h4>
                                                                <div className={`text-sm transition-colors ${dragOverDay?.weekNumber === week.weekNumber && dragOverDay?.dayName === day.name
                                                                    ? 'text-cyan-300 font-medium'
                                                                    : 'text-gray-400'
                                                                    }`}>
                                                                    {dragOverDay?.weekNumber === week.weekNumber && dragOverDay?.dayName === day.name
                                                                        ? 'Drop here!'
                                                                        : 'Drop exercises here'
                                                                    }
                                                                </div>
                                                            </div>

                                                            {day.exercises.length === 0 ? (
                                                                <p className="text-gray-400 text-sm">No exercises added</p>
                                                            ) : (
                                                                <div className="space-y-4">
                                                                    {day.exercises.map(exercise => (
                                                                        <div
                                                                            key={exercise.exerciseId}
                                                                            className="bg-gray-700 rounded-lg p-4 cursor-move"
                                                                            draggable
                                                                            onDragStart={() => handleWorkoutExerciseDragStart(week.weekNumber, day.name, exercise.exerciseId)}
                                                                        >
                                                                            <div className="flex items-center justify-between mb-4">
                                                                                <span className="text-white font-medium text-lg">{exercise.exerciseName}</span>
                                                                                <div className="flex gap-2">
                                                                                    <button
                                                                                        onClick={() => openAlternativesModal(week.weekNumber, day.name, exercise.exerciseId)}
                                                                                        className="text-cyan-400 hover:text-cyan-300 text-sm"
                                                                                    >
                                                                                        Alternatives
                                                                                    </button>
                                                                                    <div className="text-xs text-gray-400">
                                                                                        Drag to remove
                                                                                    </div>
                                                                                </div>
                                                                            </div>

                                                                            <div className="mb-4">
                                                                                <div className="flex items-start gap-4 flex-wrap">
                                                                                    <div className="w-20">
                                                                                        <label className="text-gray-300 text-sm font-medium mb-2 block">Sets</label>
                                                                                        <input
                                                                                            type="number"
                                                                                            min="1"
                                                                                            value={exercise.sets}
                                                                                            onChange={(e) => {
                                                                                                const value = e.target.value;
                                                                                                if (value === '' || parseInt(value) > 0) {
                                                                                                    updateExerciseSets(week.weekNumber, day.name, exercise.exerciseId, parseInt(value) || 1);
                                                                                                }
                                                                                            }}
                                                                                            onFocus={(e) => e.target.select()}
                                                                                            className="w-full border border-gray-600 rounded-lg px-3 py-2 bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                                                                        />
                                                                                    </div>
                                                                                    <div className="flex-1 min-w-0">
                                                                                        <label className="text-gray-300 text-sm font-medium mb-2 block">Reps per Set</label>
                                                                                        <div className="flex flex-wrap gap-2">
                                                                                            {exercise.reps.map((rep, index) => (
                                                                                                <input
                                                                                                    key={index}
                                                                                                    type="number"
                                                                                                    min="1"
                                                                                                    value={rep}
                                                                                                    onChange={(e) => updateExerciseRep(week.weekNumber, day.name, exercise.exerciseId, index, parseInt(e.target.value) || 1)}
                                                                                                    className="w-16 border border-gray-600 rounded-lg px-2 py-2 bg-gray-800 text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                                                                                    placeholder={`Set ${index + 1}`}
                                                                                                />
                                                                                            ))}
                                                                                        </div>
                                                                                    </div>
                                                                                </div>
                                                                            </div>

                                                                            <div>
                                                                                <label className="text-gray-300 text-sm font-medium mb-2 block">Comment</label>
                                                                                <textarea
                                                                                    value={exercise.comment || ""}
                                                                                    onChange={(e) => updateExerciseComment(week.weekNumber, day.name, exercise.exerciseId, e.target.value)}
                                                                                    placeholder="Add notes about form, progression, etc..."
                                                                                    className="w-full border border-gray-600 rounded-lg px-3 py-2 bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none"
                                                                                    rows={2}
                                                                                />
                                                                            </div>

                                                                            {exercise.alternatives && exercise.alternatives.length > 0 && (
                                                                                <div className="mt-3">
                                                                                    <label className="text-gray-300 text-sm font-medium mb-2 block">Alternative Exercises:</label>
                                                                                    <div className="flex flex-wrap gap-2">
                                                                                        {exercise.alternatives.map((alt, index) => (
                                                                                            <span
                                                                                                key={index}
                                                                                                className="px-2 py-1 bg-gray-600 text-gray-200 text-sm rounded flex items-center gap-1"
                                                                                            >
                                                                                                {alt}
                                                                                                <button
                                                                                                    onClick={() => {
                                                                                                        const currentAlternatives = exercise.alternatives || [];
                                                                                                        const newAlternatives = currentAlternatives.filter((_, i) => i !== index);
                                                                                                        updateExerciseAlternatives(week.weekNumber, day.name, exercise.exerciseId, newAlternatives);
                                                                                                    }}
                                                                                                    className="text-red-400 hover:text-red-300 text-xs ml-1"
                                                                                                >
                                                                                                    ✕
                                                                                                </button>
                                                                                            </span>
                                                                                        ))}
                                                                                    </div>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}

                                        {/* Add Week Button */}
                                        {shouldShowAddWeekButton(currentProgram.structure) && (
                                            <div className="flex justify-center pt-4">
                                                <button
                                                    onClick={addWeek}
                                                    className="px-6 py-3 bg-gray-700 text-white rounded-lg border border-gray-600 hover:bg-gray-600 transition font-semibold"
                                                >
                                                    {getAddWeekButtonText(currentProgram.structure)}
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Week Copy Prompt Modal */}
                            {showWeekCopyPrompt && (
                                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                                    <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="text-xl font-bold text-white">Add New {currentProgram?.structure === "weekly" ? "Week" : currentProgram?.structure === "rotating" ? "Cycle" : currentProgram?.structure === "block" ? "Block" : "Week"}</h3>
                                            <button
                                                onClick={() => {
                                                    setShowWeekCopyPrompt(false);
                                                    setWeekToCopy(null);
                                                }}
                                                className="text-gray-400 hover:text-white"
                                            >
                                                ✕
                                            </button>
                                        </div>

                                        <p className="text-gray-300 mb-4">Would you like to copy an existing {currentProgram?.structure === "weekly" ? "week" : currentProgram?.structure === "rotating" ? "cycle" : currentProgram?.structure === "block" ? "block" : "week"}?</p>

                                        <div className="space-y-3 mb-6">
                                            <button
                                                onClick={addEmptyWeek}
                                                className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg border border-gray-600 hover:bg-gray-600 transition font-semibold"
                                            >
                                                Start with Empty {currentProgram?.structure === "weekly" ? "Week" : currentProgram?.structure === "rotating" ? "Cycle" : currentProgram?.structure === "block" ? "Block" : "Week"}
                                            </button>

                                            {currentProgram?.weeks.map(week => (
                                                <button
                                                    key={week.weekNumber}
                                                    onClick={() => addWeekWithCopy(week.weekNumber)}
                                                    className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg border border-gray-600 hover:bg-gray-600 transition font-semibold"
                                                >
                                                    Copy {getWeekLabel(currentProgram.structure, week.weekNumber)}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Alternatives Modal */}
                            {showAlternativesModal && selectedExerciseForAlternatives && (
                                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                                    <div className="bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="text-xl font-bold text-white">Add Alternative Exercises</h3>
                                            <button
                                                onClick={() => {
                                                    setShowAlternativesModal(false);
                                                    setSelectedExerciseForAlternatives(null);
                                                }}
                                                className="text-gray-400 hover:text-white"
                                            >
                                                ✕
                                            </button>
                                        </div>

                                        <MultiSelectFilter
                                            options={muscleGroups}
                                            selected={selectedMuscleGroups}
                                            onSelect={setSelectedMuscleGroups}
                                            label="Filter by Muscle Group"
                                        />

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4 mb-6">
                                            {filteredExercises
                                                .filter(ex => ex.name !== selectedExerciseForAlternatives?.exerciseId)
                                                .map(exercise => (
                                                    <div
                                                        key={exercise.id}
                                                        className="bg-gray-700 rounded p-3 cursor-pointer hover:bg-gray-600 transition"
                                                        onClick={() => {
                                                            const currentExercise = currentProgram?.weeks
                                                                .find(w => w.weekNumber === selectedExerciseForAlternatives?.weekNumber)
                                                                ?.days.find(d => d.name === selectedExerciseForAlternatives?.dayName)
                                                                ?.exercises.find(e => e.exerciseId === selectedExerciseForAlternatives?.exerciseId);

                                                            const currentAlternatives = currentExercise?.alternatives || [];
                                                            const newAlternatives = [...currentAlternatives, exercise.name];

                                                            if (selectedExerciseForAlternatives) {
                                                                updateExerciseAlternatives(
                                                                    selectedExerciseForAlternatives.weekNumber,
                                                                    selectedExerciseForAlternatives.dayName,
                                                                    selectedExerciseForAlternatives.exerciseId,
                                                                    newAlternatives
                                                                );
                                                            }
                                                        }}
                                                    >
                                                        <div className="font-medium text-white">{exercise.name}</div>
                                                        {exercise.muscle_group && (
                                                            <div className="text-sm text-gray-300">{exercise.muscle_group}</div>
                                                        )}
                                                        {exercise.description && (
                                                            <div className="text-sm text-gray-400 mt-1">{exercise.description}</div>
                                                        )}
                                                    </div>
                                                ))}
                                        </div>

                                        <div className="flex justify-end gap-3">
                                            <button
                                                onClick={() => {
                                                    setShowAlternativesModal(false);
                                                    setSelectedExerciseForAlternatives(null);
                                                }}
                                                className="px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 hover:bg-gray-600 transition font-semibold"
                                            >
                                                Done
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Remove Zone */}
                    {showRemoveZone && (
                        <div
                            className="fixed top-1/2 right-4 transform -translate-y-1/2 bg-red-600 text-white p-6 rounded-lg border-2 border-red-400 shadow-lg z-50"
                            onDragOver={handleRemoveZoneDragOver}
                            onDrop={handleRemoveZoneDrop}
                        >
                            <div className="text-center">
                                <div className="text-2xl mb-2">🗑️</div>
                                <div className="font-semibold">Drop to Remove</div>
                                <div className="text-sm opacity-80">Drag exercise here to delete</div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}