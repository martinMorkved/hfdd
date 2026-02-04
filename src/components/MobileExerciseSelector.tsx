import React from "react";
import { Checkbox } from "./ui/Checkbox";
import { TextInput } from "./ui/TextInput";
import { MultiSelectFilter } from "./ui/MultiSelectFilter";
import { ExerciseHistoryButton } from "../features/exercises";
import type { Exercise } from "../features/exercises/types";

interface MobileExerciseSelectorProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    exercises: Exercise[];
    filteredExercises: Exercise[]; // Pre-filtered exercises (for display and ordering)
    searchTerm: string;
    onSearchChange: (value: string) => void;
    selectedMuscleGroups: string[];
    onMuscleGroupChange: (groups: string[]) => void;
    muscleGroups: string[];
    selectedExerciseIds: Set<string>;
    onSelectionChange: (ids: Set<string>) => void;
    onDone: () => void;
}

export const MobileExerciseSelector: React.FC<MobileExerciseSelectorProps> = ({
    isOpen,
    onClose,
    title,
    exercises,
    filteredExercises,
    searchTerm,
    onSearchChange,
    selectedMuscleGroups,
    onMuscleGroupChange,
    muscleGroups,
    selectedExerciseIds,
    onSelectionChange,
    onDone
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 bg-gray-800 flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-700 shrink-0">
                <h3 className="text-lg font-bold text-white">
                    {title}
                </h3>
                <button
                    type="button"
                    onClick={onClose}
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
                        onChange={(e) => onSearchChange(e.target.value)}
                    />
                    <MultiSelectFilter
                        options={muscleGroups}
                        selected={selectedMuscleGroups}
                        onSelect={onMuscleGroupChange}
                        label="Filter by Muscle Group"
                    />
                </div>
                <div className="flex-1 min-h-0 overflow-y-auto px-4 pb-2">
                    <div className="space-y-3">
                        {filteredExercises.map((exercise) => {
                            const isChecked = selectedExerciseIds.has(exercise.id);
                            const toggle = () => {
                                const next = new Set(selectedExerciseIds);
                                if (next.has(exercise.id)) next.delete(exercise.id);
                                else next.add(exercise.id);
                                onSelectionChange(next);
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
                <div className="shrink-0 p-4 border-t border-gray-700">
                    <button
                        type="button"
                        onClick={onDone}
                        disabled={selectedExerciseIds.size === 0}
                        className={`w-full px-4 py-3 rounded-lg font-semibold transition ${selectedExerciseIds.size === 0
                                ? "bg-gray-700 text-gray-500 cursor-not-allowed"
                                : "bg-cyan-600 text-white hover:bg-cyan-700"
                            }`}
                    >
                        Done {selectedExerciseIds.size > 0 && `(${selectedExerciseIds.size})`}
                    </button>
                </div>
            </div>
        </div>
    );
};
