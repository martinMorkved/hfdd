import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Modal, ConfirmationModal } from "../components/ui/Modal";
import { MultiSelectFilter } from "../components/ui/MultiSelectFilter";
import { Checkbox } from "../components/ui/Checkbox";
import { TextInput } from "../components/ui/TextInput";
import { TextArea } from "../components/ui/TextArea";
import { RepInput } from "../components/ui/RepInput";
import { supabase } from "../lib/supabase";
import { TrashIcon, EditIcon, CheckIcon, ChevronUpIcon, ChevronDownIcon } from "../components/icons";
import { ExerciseSidebar } from "../features/programs";
import type { Exercise } from "../features/exercises/types";
import { useWorkoutProgram, type ProgramStructure } from "../features/programs/useWorkoutProgram";
import { useExerciseManagement } from "../features/programs/useExerciseManagement";
import { useDragAndDrop } from "../features/programs/useDragAndDrop";
import { ExerciseHistoryButton } from "../features/exercises";

export default function WorkoutProgram() {
    const location = useLocation();
    const navigate = useNavigate();
    const selectedProgramId = location.state?.selectedProgramId;

    // Exercise state
    const [exercises, setExercises] = useState<Exercise[]>([]);
    const [showDeleteModal, setShowDeleteModal] = useState(false);

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

    // Use custom hooks for state management
    const {
        programs,
        currentProgram,
        programName,
        setProgramName,
        programDescription,
        setProgramDescription,
        programStructure,
        setProgramStructure,
        createNewProgram,
        addExerciseToDay,
        addExercisesToDay,
        updateExerciseLocal,
        moveExerciseInDay,
        reorderExerciseInDay,
        saveProgramChanges,
        removeExerciseFromDay,
        addWeek,
        addDayToWeek,
        removeWeek,
        removeDayFromWeek,
        updateDayName,
        selectProgram,
        setCurrentProgram,
        deleteProgram,
        updateProgramInArray
    } = useWorkoutProgram();

    // Auto-select program if coming from Programs page
    useEffect(() => {
        if (selectedProgramId && programs.length > 0) {
            const programToSelect = programs.find(p => p.id === selectedProgramId);
            if (programToSelect) {
                selectProgram(programToSelect);
            }
        }
    }, [selectedProgramId, programs, selectProgram]);

    const {
        selectedMuscleGroups,
        setSelectedMuscleGroups,
        searchTerm,
        setSearchTerm,
        updateExerciseSets,
        updateExerciseRep,
        updateExerciseComment,
        updateExerciseAlternatives
    } = useExerciseManagement(currentProgram, addExerciseToDay, updateExerciseLocal, removeExerciseFromDay);

    const {
        dragOverDay,
        draggedWorkoutExercise,
        showRemoveZone,
        handleDragStart,
        handleDragOver,
        handleDragLeave,
        handleWorkoutExerciseDragStart,
        handleWorkoutExerciseDragEnd,
        handleRemoveZoneDragOver,
        handleRemoveZoneDrop,
        handleDrop
    } = useDragAndDrop(addExerciseToDay, removeExerciseFromDay);

    // Local state for modals and UI
    const [showWeekCopyPrompt, setShowWeekCopyPrompt] = useState(false);
    const [showAlternativesModal, setShowAlternativesModal] = useState(false);
    const [selectedExerciseForAlternatives, setSelectedExerciseForAlternatives] = useState<{ weekNumber: number, dayName: string, exerciseId: string } | null>(null);
    const [showExerciseSidebar, setShowExerciseSidebar] = useState(false);
    const [showNameError, setShowNameError] = useState(false);
    // Editable program details (synced from currentProgram, saved on blur)
    const [editName, setEditName] = useState("");
    const [editDescription, setEditDescription] = useState("");
    const [editStructure, setEditStructure] = useState<ProgramStructure>("weekly");
    // Local string state for rep inputs so "select all, type 5" replaces instead of appending
    const [editingReps, setEditingReps] = useState<Record<string, string>>({});
    // Remove cycle / remove day confirmation
    const [removeCycleWeekNumber, setRemoveCycleWeekNumber] = useState<number | null>(null);
    const [removeDayInfo, setRemoveDayInfo] = useState<{ weekNumber: number; dayId: string; dayName: string } | null>(null);
    // Inline edit day name (dayId when editing, draft value)
    const [editingDayId, setEditingDayId] = useState<string | null>(null);
    const [editingDayName, setEditingDayName] = useState("");
    // Save button success feedback (green "Saved" + checkmark, then reset)
    const [saveSuccess, setSaveSuccess] = useState(false);
    // Drag-and-drop reorder: show drop indicator at this position (same day)
    const [dropTargetReorder, setDropTargetReorder] = useState<{ weekNumber: number; dayName: string; insertIndex: number } | null>(null);
    // Mobile: add-exercise full-screen target (week + day) and selected exercise ids for multi-add
    const [addExerciseTarget, setAddExerciseTarget] = useState<{ weekNumber: number; dayName: string } | null>(null);
    const [addExerciseSelectedIds, setAddExerciseSelectedIds] = useState<Set<string>>(new Set());

    // Clear selection when opening add-exercise panel
    useEffect(() => {
        if (addExerciseTarget !== null) {
            setAddExerciseSelectedIds(new Set());
        }
    }, [addExerciseTarget]);

    // Mobile layout: hide sidebar, show "Add exercise" per day and Remove button
    const [isMobile, setIsMobile] = useState(false);
    useEffect(() => {
        const mq = window.matchMedia("(max-width: 767px)");
        const update = () => setIsMobile(mq.matches);
        update();
        mq.addEventListener("change", update);
        return () => mq.removeEventListener("change", update);
    }, []);

    // Sync editable fields when current program changes
    useEffect(() => {
        if (currentProgram) {
            setEditName(currentProgram.name);
            setEditDescription(currentProgram.description ?? "");
            setEditStructure(currentProgram.structure);
        }
    }, [currentProgram?.id, currentProgram?.name, currentProgram?.description, currentProgram?.structure]);

    // Show exercise library when a program is selected or created
    useEffect(() => {
        if (currentProgram) {
            setShowExerciseSidebar(true);
        }
    }, [currentProgram]);

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

    const handleAddWeek = () => {
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
        addWeek(); // Use the database function
        setShowWeekCopyPrompt(false);
    };

    const addWeekWithCopy = (weekNumber: number) => {
        if (!currentProgram) return;
        addWeek(weekNumber); // Use the database function with copy parameter
        setShowWeekCopyPrompt(false);
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

    const shouldShowAddDayButton = (structure: ProgramStructure) => {
        return structure === "weekly" || structure === "rotating";
    };

    const getAddDayButtonText = (structure: ProgramStructure) => {
        return structure === "rotating" ? "Add Day (D, E, F…)" : "Add Day";
    };

    return (
        <div className="min-h-screen bg-gray-900">
            <div className="flex h-screen">
                {/* Exercise Sidebar (hidden on mobile; use "Add exercise" per day instead) */}
                {!isMobile && (
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
                )}

                {/* Main Content */}
                <div className="flex-1 overflow-y-auto relative">
                    <div className="p-4 md:p-8">
                        <div className="max-w-[1100px] mx-auto">
                            <div className="flex items-center justify-between mb-8">
                                <h2 className="text-2xl md:text-3xl font-bold text-white">
                                    {currentProgram ? "Edit Program" : "Create Program"}
                                </h2>
                                {!isMobile && (
                                    <button
                                        onClick={() => setShowExerciseSidebar(!showExerciseSidebar)}
                                        className="px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition font-semibold"
                                    >
                                        {showExerciseSidebar ? 'Hide' : 'Show'} Exercise Library
                                    </button>
                                )}
                            </div>

                            {/* Program Selection/Creation - only when no program selected */}
                            <div className="mb-8">
                                {!currentProgram && (
                                    <>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                            <TextInput
                                                variant="search"
                                                placeholder="Program name"
                                                value={programName}
                                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                                    setProgramName(e.target.value);
                                                    setShowNameError(false);
                                                }}
                                                error={showNameError}
                                                className="rounded-lg px-4 py-2"
                                            />
                                            <TextInput
                                                variant="search"
                                                placeholder="Description"
                                                value={programDescription}
                                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setProgramDescription(e.target.value)}
                                                className="rounded-lg px-4 py-2"
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
                                        <div className="flex justify-center mb-6">
                                            <button
                                                onClick={() => {
                                                    if (!programName.trim()) {
                                                        setShowNameError(true);
                                                    } else {
                                                        setShowNameError(false);
                                                        createNewProgram();
                                                    }
                                                }}
                                                className="px-8 py-3 bg-cyan-600 text-white rounded-lg border border-cyan-500 hover:bg-cyan-700 transition font-semibold text-lg"
                                            >
                                                Create Program
                                            </button>
                                        </div>
                                    </>
                                )}

                                {/* Program list: switch program or create new */}
                                {programs.length > 0 && (
                                    <div className="mb-4">
                                        <h3 className="text-lg font-semibold text-white mb-2">
                                            {currentProgram ? "Switch program:" : "Select Program:"}
                                        </h3>
                                        <div className="flex gap-2 flex-wrap items-center">
                                            {currentProgram && (
                                                <button
                                                    onClick={() => setCurrentProgram(null)}
                                                    className="px-4 py-2 rounded-lg border border-dashed border-cyan-500 text-cyan-400 hover:bg-cyan-900/30 transition"
                                                >
                                                    + New program
                                                </button>
                                            )}
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
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between gap-4 flex-wrap">
                                            <div className="relative max-w-md min-w-0 flex-1">
                                                <input
                                                    type="text"
                                                    value={editName}
                                                    onChange={(e) => setEditName(e.target.value)}
                                                    onBlur={() => {
                                                        const trimmed = editName.trim();
                                                        if (trimmed && trimmed !== currentProgram.name) {
                                                            updateProgramInArray({ ...currentProgram, name: trimmed });
                                                        } else if (!trimmed) setEditName(currentProgram.name);
                                                    }}
                                                    className="text-2xl font-bold text-white bg-gray-800 border border-gray-600 rounded-lg pl-4 pr-10 py-2 w-full focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 placeholder-gray-400"
                                                    placeholder="Program name"
                                                />
                                                <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                                                    <EditIcon size={18} className="text-gray-400" />
                                                </span>
                                            </div>
                                            <div className="flex gap-2 shrink-0">
                                                <button
                                                    onClick={async () => {
                                                        const ok = await saveProgramChanges();
                                                        if (ok) {
                                                            setSaveSuccess(true);
                                                            setTimeout(() => setSaveSuccess(false), 2500);
                                                        }
                                                    }}
                                                    className={`px-4 py-2 rounded-lg transition text-sm font-medium flex items-center gap-2 ${saveSuccess
                                                        ? "bg-green-600 text-white border border-green-500"
                                                        : "bg-cyan-600 text-white hover:bg-cyan-700 border border-transparent"
                                                        }`}
                                                >
                                                    {saveSuccess ? "Saved" : "Save"}
                                                    {saveSuccess && <CheckIcon size={18} className="shrink-0" />}
                                                </button>
                                                <button
                                                    onClick={() => setShowDeleteModal(true)}
                                                    className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm font-medium"
                                                >
                                                    Delete Program
                                                </button>
                                            </div>
                                        </div>
                                        <div className="relative max-w-md">
                                            <input
                                                type="text"
                                                value={editDescription}
                                                onChange={(e) => setEditDescription(e.target.value)}
                                                onBlur={() => {
                                                    if (editDescription !== (currentProgram.description ?? "")) {
                                                        updateProgramInArray({ ...currentProgram, description: editDescription || undefined });
                                                    }
                                                }}
                                                className="text-gray-300 bg-gray-800 border border-gray-600 rounded-lg pl-4 pr-10 py-2 w-full focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 placeholder-gray-400"
                                                placeholder="Description (optional)"
                                            />
                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                                                <EditIcon size={18} className="text-gray-400" />
                                            </span>
                                        </div>
                                        <select
                                            value={editStructure}
                                            onChange={(e) => {
                                                const value = e.target.value as ProgramStructure;
                                                setEditStructure(value);
                                                updateProgramInArray({ ...currentProgram, structure: value });
                                            }}
                                            className="text-cyan-400 text-sm font-medium bg-gray-800 border border-gray-600 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                        >
                                            <option value="weekly">Weekly (7-day cycles)</option>
                                            <option value="rotating">Rotating (A/B/C days)</option>
                                            <option value="block">Block-based (Mesocycles)</option>
                                            <option value="frequency">Single Template (Full body)</option>
                                        </select>
                                    </div>

                                    {/* Weeks */}
                                    <div className="space-y-8">
                                        {currentProgram.weeks.map(week => (
                                            <div key={week.weekNumber} className="space-y-4">
                                                <div className="flex items-center justify-between">
                                                    <h3 className="text-xl font-bold text-cyan-400">{getWeekLabel(currentProgram.structure, week.weekNumber)}</h3>
                                                    {/* Remove cycle (rotating only, when more than one cycle) */}
                                                    {currentProgram.structure === "rotating" && currentProgram.weeks.length > 1 && (
                                                        <button
                                                            type="button"
                                                            onClick={() => setRemoveCycleWeekNumber(week.weekNumber)}
                                                            className="px-3 py-1.5 text-sm rounded-lg border border-red-500/60 text-red-400 hover:bg-red-900/30 transition"
                                                        >
                                                            Remove cycle
                                                        </button>
                                                    )}
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
                                                            onDragLeave={() => { handleDragLeave(); setDropTargetReorder(null); }}
                                                            onDrop={() => { handleDrop(week.weekNumber, day.name); setDropTargetReorder(null); }}
                                                        >
                                                            <div className="flex items-center justify-between mb-6">
                                                                {editingDayId === day.id ? (
                                                                    <div className="relative flex-1 max-w-xs">
                                                                        <input
                                                                            type="text"
                                                                            value={editingDayName}
                                                                            onChange={(e) => setEditingDayName(e.target.value)}
                                                                            onBlur={() => {
                                                                                const trimmed = editingDayName.trim();
                                                                                if (trimmed && trimmed !== day.name) {
                                                                                    updateDayName(week.weekNumber, day.id, trimmed);
                                                                                }
                                                                                setEditingDayId(null);
                                                                            }}
                                                                            onKeyDown={(e) => {
                                                                                if (e.key === "Enter") {
                                                                                    e.currentTarget.blur();
                                                                                }
                                                                            }}
                                                                            autoFocus
                                                                            className="text-xl font-semibold text-white bg-gray-700 border border-gray-600 rounded-lg pl-3 pr-10 py-2 w-full focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                                                        />
                                                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                                                                            <EditIcon size={18} className="text-gray-400" />
                                                                        </span>
                                                                    </div>
                                                                ) : (
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => {
                                                                            setEditingDayId(day.id);
                                                                            setEditingDayName(day.name);
                                                                        }}
                                                                        className="flex items-center gap-2 text-left group"
                                                                    >
                                                                        <h4 className="text-xl font-semibold text-white">{day.name}</h4>
                                                                        <EditIcon size={18} className="text-gray-400 opacity-70 group-hover:opacity-100 transition" />
                                                                    </button>
                                                                )}
                                                                <div className="flex items-center gap-3">
                                                                    {/* Remove day (rotating: any day when >1; weekly: only Extra N) */}
                                                                    {(
                                                                        (currentProgram.structure === "rotating" && week.days.length > 1) ||
                                                                        (currentProgram.structure === "weekly" && day.name.startsWith("Extra "))
                                                                    ) && (
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => setRemoveDayInfo({ weekNumber: week.weekNumber, dayId: day.id, dayName: day.name })}
                                                                                className="text-sm px-2 py-1 rounded border border-red-500/60 text-red-400 hover:bg-red-900/30 transition"
                                                                            >
                                                                                Remove day
                                                                            </button>
                                                                        )}
                                                                    {!isMobile && (
                                                                        <span className={`text-sm transition-colors ${dragOverDay?.weekNumber === week.weekNumber && dragOverDay?.dayName === day.name
                                                                            ? 'text-cyan-300 font-medium'
                                                                            : 'text-gray-400'
                                                                            }`}>
                                                                            {dragOverDay?.weekNumber === week.weekNumber && dragOverDay?.dayName === day.name
                                                                                ? 'Drop here!'
                                                                                : 'Drop exercises here'
                                                                            }
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>

                                                            {day.exercises.length === 0 ? (
                                                                <p className="text-gray-400 text-sm">No exercises added</p>
                                                            ) : (
                                                                <div className="space-y-4">
                                                                    {day.exercises.map((exercise, exerciseIndex) => {
                                                                        const isReorderDropTarget = draggedWorkoutExercise
                                                                            && draggedWorkoutExercise.weekNumber === week.weekNumber
                                                                            && draggedWorkoutExercise.dayName === day.name
                                                                            && draggedWorkoutExercise.workoutExerciseId !== exercise.id
                                                                            && dropTargetReorder?.weekNumber === week.weekNumber
                                                                            && dropTargetReorder?.dayName === day.name
                                                                            && dropTargetReorder?.insertIndex === exerciseIndex;
                                                                        return (
                                                                            <div
                                                                                key={exercise.id}
                                                                                className="relative"
                                                                            >
                                                                                {isReorderDropTarget && (
                                                                                    <div className="absolute -top-2 left-0 right-0 h-1 bg-cyan-500 rounded z-10 pointer-events-none" title="Drop to reorder" />
                                                                                )}
                                                                                <div
                                                                                    className={`bg-gray-700 rounded-lg p-4 cursor-move ${isReorderDropTarget ? 'ring-2 ring-cyan-500 ring-inset' : ''}`}
                                                                                    draggable
                                                                                    onDragStart={() => handleWorkoutExerciseDragStart(week.weekNumber, day.name, exercise.exerciseId, exercise.id)}
                                                                                    onDragEnd={() => { handleWorkoutExerciseDragEnd(); setDropTargetReorder(null); }}
                                                                                    onDragOver={(e) => {
                                                                                        e.preventDefault();
                                                                                        e.stopPropagation();
                                                                                        if (draggedWorkoutExercise && draggedWorkoutExercise.weekNumber === week.weekNumber && draggedWorkoutExercise.dayName === day.name && draggedWorkoutExercise.workoutExerciseId !== exercise.id) {
                                                                                            setDropTargetReorder({ weekNumber: week.weekNumber, dayName: day.name, insertIndex: exerciseIndex });
                                                                                        }
                                                                                    }}
                                                                                    onDrop={(e) => {
                                                                                        e.preventDefault();
                                                                                        e.stopPropagation();
                                                                                        setDropTargetReorder(null);
                                                                                        if (draggedWorkoutExercise && draggedWorkoutExercise.weekNumber === week.weekNumber && draggedWorkoutExercise.dayName === day.name && draggedWorkoutExercise.workoutExerciseId !== exercise.id) {
                                                                                            reorderExerciseInDay(week.weekNumber, day.name, draggedWorkoutExercise.workoutExerciseId, exerciseIndex);
                                                                                            handleWorkoutExerciseDragEnd();
                                                                                        }
                                                                                    }}
                                                                                >
                                                                                    <div className="flex items-center justify-between mb-3">
                                                                                        <span className="text-white font-medium text-lg">{exercise.exerciseName}</span>
                                                                                        <div className="flex items-center gap-2">
                                                                                            <div className="flex items-center rounded border border-gray-600 overflow-hidden">
                                                                                                <button
                                                                                                    type="button"
                                                                                                    onClick={() => moveExerciseInDay(week.weekNumber, day.name, exercise.id, 'up')}
                                                                                                    disabled={exerciseIndex === 0}
                                                                                                    className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-600 disabled:opacity-40 disabled:pointer-events-none transition"
                                                                                                    title="Move up"
                                                                                                >
                                                                                                    <ChevronUpIcon size={18} />
                                                                                                </button>
                                                                                                <button
                                                                                                    type="button"
                                                                                                    onClick={() => moveExerciseInDay(week.weekNumber, day.name, exercise.id, 'down')}
                                                                                                    disabled={exerciseIndex === day.exercises.length - 1}
                                                                                                    className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-600 disabled:opacity-40 disabled:pointer-events-none transition"
                                                                                                    title="Move down"
                                                                                                >
                                                                                                    <ChevronDownIcon size={18} />
                                                                                                </button>
                                                                                            </div>
                                                                                            <ExerciseHistoryButton
                                                                                                exerciseId={exercise.exerciseId}
                                                                                                exerciseName={exercise.exerciseName}
                                                                                                variant="icon"
                                                                                            />
                                                                                            <button
                                                                                                onClick={() => openAlternativesModal(week.weekNumber, day.name, exercise.exerciseId)}
                                                                                                className="text-cyan-400 hover:text-cyan-300 text-sm"
                                                                                            >
                                                                                                Alternatives
                                                                                            </button>
                                                                                            <button
                                                                                                type="button"
                                                                                                onClick={() => removeExerciseFromDay(week.weekNumber, day.name, exercise.id)}
                                                                                                className="text-sm px-2 py-1 rounded border border-red-500/60 text-red-400 hover:bg-red-900/30 transition"
                                                                                            >
                                                                                                Remove
                                                                                            </button>
                                                                                        </div>
                                                                                    </div>

                                                                                    <div className="mb-4">
                                                                                        <div className="flex gap-2 flex-wrap items-end">
                                                                                            {exercise.reps.map((rep, index) => {
                                                                                                const repKey = `${exercise.id}-${index}`;
                                                                                                const repDisplay = repKey in editingReps ? editingReps[repKey] : String(rep);
                                                                                                return (
                                                                                                    <div key={index} className="flex flex-col">
                                                                                                        <span className="text-gray-400 text-sm mb-1">Set {index + 1}:</span>
                                                                                                        <div className="flex items-center gap-1">
                                                                                                            <RepInput
                                                                                                                value={repDisplay}
                                                                                                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditingReps(prev => ({ ...prev, [repKey]: e.target.value }))}
                                                                                                                onBlur={() => {
                                                                                                                    const raw = editingReps[repKey] ?? String(rep);
                                                                                                                    const parsed = parseInt(raw, 10);
                                                                                                                    const value = (!isNaN(parsed) && parsed >= 1) ? parsed : rep;
                                                                                                                    updateExerciseRep(week.weekNumber, day.name, exercise.exerciseId, index, value);
                                                                                                                    setEditingReps(prev => {
                                                                                                                        const next = { ...prev };
                                                                                                                        delete next[repKey];
                                                                                                                        return next;
                                                                                                                    });
                                                                                                                }}
                                                                                                                placeholder="Reps"
                                                                                                            />
                                                                                                            {exercise.reps.length > 1 && (
                                                                                                                <button
                                                                                                                    type="button"
                                                                                                                    onClick={() => {
                                                                                                                        const newReps = exercise.reps.filter((_, i) => i !== index);
                                                                                                                        updateExerciseLocal(week.weekNumber, day.name, exercise.exerciseId, {
                                                                                                                            reps: newReps,
                                                                                                                            sets: newReps.length
                                                                                                                        });
                                                                                                                        setEditingReps(prev => {
                                                                                                                            const next = { ...prev };
                                                                                                                            exercise.reps.forEach((_, i) => delete next[`${exercise.id}-${i}`]);
                                                                                                                            return next;
                                                                                                                        });
                                                                                                                    }}
                                                                                                                    className="h-9 text-gray-500 hover:text-red-400 transition text-lg leading-none px-1 flex items-center justify-center"
                                                                                                                    title="Remove set"
                                                                                                                >
                                                                                                                    ×
                                                                                                                </button>
                                                                                                            )}
                                                                                                        </div>
                                                                                                    </div>
                                                                                                );
                                                                                            })}
                                                                                            <button
                                                                                                type="button"
                                                                                                onClick={() => updateExerciseSets(week.weekNumber, day.name, exercise.exerciseId, exercise.sets + 1)}
                                                                                                className="w-10 h-9 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition text-xl font-bold flex items-center justify-center shrink-0"
                                                                                                title="Add set"
                                                                                            >
                                                                                                +
                                                                                            </button>
                                                                                        </div>
                                                                                    </div>

                                                                                    <div>
                                                                                        <label className="text-gray-300 text-sm font-medium mb-2 block">Comment</label>
                                                                                        <TextArea
                                                                                            value={exercise.comment || ""}
                                                                                            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => updateExerciseComment(week.weekNumber, day.name, exercise.exerciseId, e.target.value)}
                                                                                            placeholder="Add notes about form, progression, etc..."
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
                                                                            </div>
                                                                        );
                                                                    })}
                                                                </div>
                                                            )}
                                                            {isMobile && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setAddExerciseTarget({ weekNumber: week.weekNumber, dayName: day.name })}
                                                                    className="mt-4 w-full py-2.5 rounded-lg border border-dashed border-cyan-500 text-cyan-400 hover:bg-cyan-900/30 transition font-medium"
                                                                >
                                                                    + Add exercise
                                                                </button>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>

                                                {/* Add Day button (weekly: extra days; rotating: Day D, E, F…) */}
                                                {shouldShowAddDayButton(currentProgram.structure) && (
                                                    <div className="flex justify-center pt-2">
                                                        <button
                                                            type="button"
                                                            onClick={() => addDayToWeek(week.weekNumber)}
                                                            className="px-4 py-2 rounded-lg border border-dashed border-gray-500 text-gray-400 hover:bg-gray-700 hover:text-white transition font-medium"
                                                        >
                                                            {getAddDayButtonText(currentProgram.structure)}
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        ))}

                                        {/* Add Week Button */}
                                        {shouldShowAddWeekButton(currentProgram.structure) && (
                                            <div className="flex justify-center pt-4">
                                                <button
                                                    onClick={handleAddWeek}
                                                    className="px-6 py-3 bg-gray-700 text-white rounded-lg border border-gray-600 hover:bg-gray-600 transition font-semibold"
                                                >
                                                    {getAddWeekButtonText(currentProgram.structure)}
                                                </button>
                                            </div>
                                        )}

                                        {/* Save and Save and Finish buttons */}
                                        <div className="flex justify-center gap-4 pt-6">
                                            <button
                                                onClick={async () => {
                                                    const ok = await saveProgramChanges();
                                                    if (ok) {
                                                        setSaveSuccess(true);
                                                        setTimeout(() => setSaveSuccess(false), 2500);
                                                    }
                                                }}
                                                className={`px-6 py-3 rounded-lg transition font-semibold flex items-center gap-2 ${saveSuccess
                                                    ? "bg-green-600 text-white border border-green-500"
                                                    : "bg-cyan-600 text-white hover:bg-cyan-700 border border-cyan-500"
                                                    }`}
                                            >
                                                {saveSuccess ? "Saved" : "Save"}
                                                {saveSuccess && <CheckIcon size={20} className="shrink-0" />}
                                            </button>
                                            <button
                                                onClick={async () => {
                                                    const ok = await saveProgramChanges();
                                                    if (ok) navigate("/programs");
                                                }}
                                                className="px-6 py-3 bg-cyan-600 text-white rounded-lg border border-cyan-500 hover:bg-cyan-700 transition font-semibold"
                                            >
                                                Save and Finish
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Week Copy Prompt Modal */}
                            <Modal
                                isOpen={showWeekCopyPrompt}
                                onClose={() => setShowWeekCopyPrompt(false)}
                                title={`Add New ${currentProgram?.structure === "weekly" ? "Week" : currentProgram?.structure === "rotating" ? "Cycle" : currentProgram?.structure === "block" ? "Block" : "Week"}`}
                            >
                                <p className="text-gray-300 mb-4">
                                    Would you like to copy an existing {currentProgram?.structure === "weekly" ? "week" : currentProgram?.structure === "rotating" ? "cycle" : currentProgram?.structure === "block" ? "block" : "week"}?
                                </p>

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
                            </Modal>

                            {/* Alternatives Modal – Done fixed at bottom */}
                            <Modal
                                isOpen={showAlternativesModal}
                                onClose={() => {
                                    setShowAlternativesModal(false);
                                    setSelectedExerciseForAlternatives(null);
                                }}
                                title="Add alternative exercises"
                                maxWidth="max-w-md"
                            >
                                <div className="flex flex-col max-h-[70vh]">
                                    <div className="space-y-4 shrink-0">
                                        <TextInput
                                            variant="search"
                                            placeholder="Search exercises..."
                                            value={searchTerm}
                                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                                        />
                                        <MultiSelectFilter
                                            options={muscleGroups}
                                            selected={selectedMuscleGroups}
                                            onSelect={setSelectedMuscleGroups}
                                            label="Filter by Muscle Group"
                                        />
                                    </div>
                                    <div className="flex-1 min-h-0 overflow-y-auto space-y-2 mt-2">
                                        {filteredExercises
                                            .filter(ex => ex.id !== selectedExerciseForAlternatives?.exerciseId)
                                            .map((ex) => (
                                                <button
                                                    key={ex.id}
                                                    type="button"
                                                    onClick={() => {
                                                        const currentExercise = currentProgram?.weeks
                                                            .find(w => w.weekNumber === selectedExerciseForAlternatives?.weekNumber)
                                                            ?.days.find(d => d.name === selectedExerciseForAlternatives?.dayName)
                                                            ?.exercises.find(e => e.exerciseId === selectedExerciseForAlternatives?.exerciseId);
                                                        const currentAlternatives = currentExercise?.alternatives || [];
                                                        const newAlternatives = [...currentAlternatives, ex.name];
                                                        if (selectedExerciseForAlternatives) {
                                                            updateExerciseAlternatives(
                                                                selectedExerciseForAlternatives.weekNumber,
                                                                selectedExerciseForAlternatives.dayName,
                                                                selectedExerciseForAlternatives.exerciseId,
                                                                newAlternatives
                                                            );
                                                        }
                                                    }}
                                                    className="w-full text-left bg-gray-700 rounded-lg p-3 hover:bg-gray-600 transition"
                                                >
                                                    <div className="font-medium text-white">{ex.name}</div>
                                                    {ex.muscle_group && <div className="text-sm text-gray-300">{ex.muscle_group}</div>}
                                                </button>
                                            ))}
                                    </div>
                                    <div className="shrink-0 pt-4 border-t border-gray-700 mt-4">
                                        <button
                                            onClick={() => {
                                                setShowAlternativesModal(false);
                                                setSelectedExerciseForAlternatives(null);
                                            }}
                                            className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 hover:bg-gray-600 transition font-semibold"
                                        >
                                            Done
                                        </button>
                                    </div>
                                </div>
                            </Modal>

                            {/* Add exercise full-screen (mobile): checkboxes + fixed Done */}
                            {isMobile && addExerciseTarget !== null && (
                                <div className="fixed inset-0 z-50 bg-gray-800 flex flex-col">
                                    <div className="flex items-center justify-between p-4 border-b border-gray-700 shrink-0">
                                        <h3 className="text-lg font-bold text-white">
                                            Add exercise to {addExerciseTarget.dayName}
                                        </h3>
                                        <button
                                            type="button"
                                            onClick={() => setAddExerciseTarget(null)}
                                            className="text-gray-400 hover:text-white p-2"
                                            aria-label="Close"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                    <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
                                        <div className="p-4 shrink-0 space-y-4">
                                            <TextInput
                                                variant="search"
                                                placeholder="Search exercises..."
                                                value={searchTerm}
                                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                                            />
                                            <MultiSelectFilter
                                                options={muscleGroups}
                                                selected={selectedMuscleGroups}
                                                onSelect={setSelectedMuscleGroups}
                                                label="Filter by Muscle Group"
                                            />
                                        </div>
                                        <div className="flex-1 min-h-0 overflow-y-auto px-4 pb-2">
                                            <div className="space-y-3">
                                                {filteredExercises.map((exercise) => {
                                                    const isChecked = addExerciseSelectedIds.has(exercise.id);
                                                    const toggle = () => {
                                                        setAddExerciseSelectedIds((prev) => {
                                                            const next = new Set(prev);
                                                            if (next.has(exercise.id)) next.delete(exercise.id);
                                                            else next.add(exercise.id);
                                                            return next;
                                                        });
                                                    };
                                                    return (
                                                        <div
                                                            key={exercise.id}
                                                            role="button"
                                                            tabIndex={0}
                                                            onClick={toggle}
                                                            onKeyDown={(e) => {
                                                                if (e.key === "Enter" || e.key === " ") {
                                                                    e.preventDefault();
                                                                    toggle();
                                                                }
                                                            }}
                                                            className="w-full text-left bg-gray-700 rounded-lg p-3 hover:bg-gray-600 transition cursor-pointer flex items-center gap-3"
                                                        >
                                                            <Checkbox
                                                                checked={isChecked}
                                                                onChange={toggle}
                                                                ariaLabel={`Select ${exercise.name}`}
                                                            />
                                                            <div className="flex-1 min-w-0">
                                                                <div className="font-medium text-white">{exercise.name}</div>
                                                                {exercise.muscle_group && (
                                                                    <div className="text-sm text-gray-300">{exercise.muscle_group}</div>
                                                                )}
                                                                {exercise.description && (
                                                                    <div className="text-sm text-gray-400 mt-1">{exercise.description}</div>
                                                                )}
                                                            </div>
                                                            <span onClick={(e) => e.stopPropagation()}>
                                                                <ExerciseHistoryButton
                                                                    exerciseId={exercise.id}
                                                                    exerciseName={exercise.name}
                                                                    variant="icon"
                                                                    className="shrink-0"
                                                                />
                                                            </span>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="shrink-0 p-4 border-t border-gray-700">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                if (addExerciseTarget && addExerciseSelectedIds.size > 0) {
                                                    const order = filteredExercises.map((e) => e.id);
                                                    const toAdd = order
                                                        .filter((id) => addExerciseSelectedIds.has(id))
                                                        .map((id) => filteredExercises.find((e) => e.id === id))
                                                        .filter((ex): ex is Exercise => ex != null);
                                                    addExercisesToDay(toAdd, addExerciseTarget.weekNumber, addExerciseTarget.dayName);
                                                }
                                                setAddExerciseTarget(null);
                                                setAddExerciseSelectedIds(new Set());
                                            }}
                                            className="w-full py-3 bg-cyan-600 text-white rounded-lg font-semibold hover:bg-cyan-700 transition"
                                        >
                                            Done
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Remove Zone (desktop only; mobile uses Remove button) */}
                    {!isMobile && showRemoveZone && (
                        <div
                            className="fixed top-1/2 right-4 transform -translate-y-1/2 bg-red-600 text-white p-6 rounded-lg border-2 border-red-400 shadow-lg z-50"
                            onDragOver={handleRemoveZoneDragOver}
                            onDrop={handleRemoveZoneDrop}
                        >
                            <div className="text-center">
                                <TrashIcon size={32} className="mx-auto mb-2" />
                                <div className="font-semibold">Drop to Remove</div>
                                <div className="text-sm opacity-80">Drag exercise here to delete</div>
                            </div>
                        </div>
                    )}

                    {/* Delete Confirmation Modal */}
                    <ConfirmationModal
                        isOpen={showDeleteModal}
                        onClose={() => setShowDeleteModal(false)}
                        onConfirm={() => {
                            if (currentProgram) {
                                const programId = currentProgram.id;
                                setShowDeleteModal(false);
                                deleteProgram(programId);
                            }
                        }}
                        title="Delete Program"
                        message={`Are you sure you want to delete "${currentProgram?.name ?? 'this program'}"? This action cannot be undone.`}
                        confirmText="Delete"
                        confirmButtonStyle="bg-red-600 hover:bg-red-700"
                    />

                    {/* Remove cycle confirmation (rotating) */}
                    <ConfirmationModal
                        isOpen={removeCycleWeekNumber !== null}
                        onClose={() => setRemoveCycleWeekNumber(null)}
                        onConfirm={() => {
                            if (removeCycleWeekNumber !== null) {
                                removeWeek(removeCycleWeekNumber);
                                setRemoveCycleWeekNumber(null);
                            }
                        }}
                        title="Remove cycle"
                        message={`Remove this cycle? All days and exercises in it will be deleted. This cannot be undone.`}
                        confirmText="Remove cycle"
                        confirmButtonStyle="bg-red-600 hover:bg-red-700"
                    />

                    {/* Remove day confirmation */}
                    <ConfirmationModal
                        isOpen={removeDayInfo !== null}
                        onClose={() => setRemoveDayInfo(null)}
                        onConfirm={() => {
                            if (removeDayInfo) {
                                removeDayFromWeek(removeDayInfo.weekNumber, removeDayInfo.dayId);
                                setRemoveDayInfo(null);
                            }
                        }}
                        title="Remove day"
                        message={removeDayInfo ? `Remove "${removeDayInfo.dayName}"? All exercises in this day will be deleted. This cannot be undone.` : ""}
                        confirmText="Remove day"
                        confirmButtonStyle="bg-red-600 hover:bg-red-700"
                    />
                </div>
            </div>
        </div>
    );
}