import { useState } from "react";
import type { Exercise } from "../exercises/types";
import type { WorkoutProgram, WorkoutExercise } from "./useWorkoutProgram";

export const useExerciseManagement = (
    currentProgram: WorkoutProgram | null,
    addExerciseToDay: (exercise: Exercise, weekNumber: number, dayName: string) => Promise<void>,
    updateExercise: (weekNumber: number, dayName: string, exerciseId: string, updates: Partial<WorkoutExercise>) => Promise<void>,
    removeExerciseFromDay: (weekNumber: number, dayName: string, exerciseId: string) => Promise<void>
) => {
    const [selectedMuscleGroups, setSelectedMuscleGroups] = useState<string[]>([]);
    const [searchTerm, setSearchTerm] = useState("");

    const updateExerciseSets = (weekNumber: number, dayName: string, exerciseId: string, sets: number) => {
        if (!currentProgram) return;

        // Update reps array to match the new number of sets exactly
        const week = currentProgram.weeks.find(w => w.weekNumber === weekNumber);
        if (week) {
            const day = week.days.find(d => d.name === dayName);
            if (day) {
                const exercise = day.exercises.find(e => e.exerciseId === exerciseId);
                if (exercise) {
                    const lastRep = exercise.reps[exercise.reps.length - 1] || 10;
                    const newReps = [];
                    for (let i = 0; i < sets; i++) {
                        newReps.push(exercise.reps[i] || lastRep);
                    }

                    updateExercise(weekNumber, dayName, exerciseId, {
                        sets,
                        reps: newReps
                    });
                }
            }
        }
    };

    const updateExerciseRep = (weekNumber: number, dayName: string, exerciseId: string, repIndex: number, reps: number) => {
        if (!currentProgram) return;

        const week = currentProgram.weeks.find(w => w.weekNumber === weekNumber);
        if (week) {
            const day = week.days.find(d => d.name === dayName);
            if (day) {
                const exercise = day.exercises.find(e => e.exerciseId === exerciseId);
                if (exercise && exercise.reps[repIndex] !== undefined) {
                    const newReps = [...exercise.reps];
                    newReps[repIndex] = reps;

                    updateExercise(weekNumber, dayName, exerciseId, {
                        reps: newReps
                    });
                }
            }
        }
    };

    const updateExerciseComment = (weekNumber: number, dayName: string, exerciseId: string, comment: string) => {
        if (!currentProgram) return;

        updateExercise(weekNumber, dayName, exerciseId, {
            comment
        });
    };

    const updateExerciseAlternatives = (weekNumber: number, dayName: string, exerciseId: string, alternatives: string[]) => {
        if (!currentProgram) return;

        updateExercise(weekNumber, dayName, exerciseId, {
            alternatives
        });
    };

    return {
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
    };
}; 