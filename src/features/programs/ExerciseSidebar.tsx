import React from "react";
import { MultiSelectFilter } from "../../components/ui/MultiSelectFilter";
import { TextInput } from "../../components/ui/TextInput";
import { ExerciseHistoryButton } from "../exercises/ExerciseHistoryButton";
import type { Exercise } from "../exercises/types";

interface ExerciseSidebarProps {
    showExerciseSidebar: boolean;
    setShowExerciseSidebar: (show: boolean) => void;
    exercises: Exercise[];
    filteredExercises: Exercise[];
    muscleGroups: string[];
    selectedMuscleGroups: string[];
    setSelectedMuscleGroups: (groups: string[]) => void;
    searchTerm: string;
    setSearchTerm: (term: string) => void;
    onDragStart: (exercise: Exercise) => void;
}

export const ExerciseSidebar: React.FC<ExerciseSidebarProps> = ({
    showExerciseSidebar,
    setShowExerciseSidebar,
    filteredExercises,
    muscleGroups,
    selectedMuscleGroups,
    setSelectedMuscleGroups,
    searchTerm,
    setSearchTerm,
    onDragStart
}) => {
    if (!showExerciseSidebar) return null;

    return (
        <div className="w-80 bg-gray-800 border-r border-gray-700 overflow-y-auto">
            <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-white">Exercise Library</h3>
                    <button
                        onClick={() => setShowExerciseSidebar(false)}
                        className="text-gray-400 hover:text-white"
                    >
                        ✕
                    </button>
                </div>

                {/* Search Input */}
                <div className="mb-4">
                    <TextInput
                        variant="search"
                        placeholder="Search exercises..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <MultiSelectFilter
                    options={muscleGroups}
                    selected={selectedMuscleGroups}
                    onSelect={setSelectedMuscleGroups}
                    label="Filter by Muscle Group"
                />

                <div className="space-y-3">
                    {filteredExercises.map(exercise => (
                        <div
                            key={exercise.id}
                            draggable
                            onDragStart={() => onDragStart(exercise)}
                            className="bg-gray-700 rounded-lg p-3 cursor-move hover:bg-gray-600 transition"
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex-1">
                                    <div className="font-medium text-white">{exercise.name}</div>
                                    {exercise.muscle_group && (
                                        <div className="text-sm text-gray-300">{exercise.muscle_group}</div>
                                    )}
                                    {exercise.description && (
                                        <div className="text-sm text-gray-400 mt-1">{exercise.description}</div>
                                    )}
                                </div>
                                <ExerciseHistoryButton
                                    exerciseId={exercise.id}
                                    exerciseName={exercise.name}
                                    variant="icon"
                                    className="ml-2"
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
