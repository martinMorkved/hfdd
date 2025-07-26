import { useState } from "react";
import type { Exercise } from "../data/exercises";
import type { WorkoutProgram, WorkoutExercise } from "./useWorkoutProgram";

export const useExerciseManagement = (
    currentProgram: WorkoutProgram | null,
    setCurrentProgram: (program: WorkoutProgram | null) => void,
    updateProgramInArray: (program: WorkoutProgram) => void
) => {
    const [selectedMuscleGroups, setSelectedMuscleGroups] = useState<string[]>([]);
    const [searchTerm, setSearchTerm] = useState("");

    const addExerciseToDay = (exercise: Exercise, weekNumber: number, dayName: string) => {
        if (!currentProgram) return;

        const updatedProgram = { ...currentProgram };
        const week = updatedProgram.weeks.find(w => w.weekNumber === weekNumber);
        if (week) {
            const dayIndex = week.days.findIndex(day => day.name === dayName);

            if (dayIndex !== -1) {
                const newWorkoutExercise: WorkoutExercise = {
                    exerciseId: exercise.id,
                    exerciseName: exercise.name,
                    sets: 3,
                    reps: [10, 10, 10]
                };

                week.days[dayIndex].exercises.push(newWorkoutExercise);
                setCurrentProgram(updatedProgram);
                updateProgramInArray(updatedProgram);
            }
        }
    };

    const updateExerciseSets = (weekNumber: number, dayName: string, exerciseId: string, sets: number) => {
        if (!currentProgram) return;

        const updatedProgram = { ...currentProgram };
        const week = updatedProgram.weeks.find(w => w.weekNumber === weekNumber);
        if (week) {
            const day = week.days.find(d => d.name === dayName);
            if (day) {
                const exercise = day.exercises.find(e => e.exerciseId === exerciseId);
                if (exercise) {
                    exercise.sets = sets;
                    // Update reps array to match the new number of sets exactly
                    const lastRep = exercise.reps[exercise.reps.length - 1] || 10;
                    const newReps = [];
                    for (let i = 0; i < sets; i++) {
                        newReps.push(exercise.reps[i] || lastRep);
                    }
                    exercise.reps = newReps;
                    setCurrentProgram(updatedProgram);
                    updateProgramInArray(updatedProgram);
                }
            }
        }
    };

    const updateExerciseRep = (weekNumber: number, dayName: string, exerciseId: string, repIndex: number, reps: number) => {
        if (!currentProgram) return;

        const updatedProgram = { ...currentProgram };
        const week = updatedProgram.weeks.find(w => w.weekNumber === weekNumber);
        if (week) {
            const day = week.days.find(d => d.name === dayName);
            if (day) {
                const exercise = day.exercises.find(e => e.exerciseId === exerciseId);
                if (exercise && exercise.reps[repIndex] !== undefined) {
                    exercise.reps[repIndex] = reps;
                    setCurrentProgram(updatedProgram);
                    updateProgramInArray(updatedProgram);
                }
            }
        }
    };

    const updateExerciseComment = (weekNumber: number, dayName: string, exerciseId: string, comment: string) => {
        if (!currentProgram) return;

        const updatedProgram = { ...currentProgram };
        const week = updatedProgram.weeks.find(w => w.weekNumber === weekNumber);
        if (week) {
            const day = week.days.find(d => d.name === dayName);
            if (day) {
                const exercise = day.exercises.find(e => e.exerciseId === exerciseId);
                if (exercise) {
                    exercise.comment = comment;
                    setCurrentProgram(updatedProgram);
                    updateProgramInArray(updatedProgram);
                }
            }
        }
    };

    const updateExerciseAlternatives = (weekNumber: number, dayName: string, exerciseId: string, alternatives: string[]) => {
        if (!currentProgram) return;

        const updatedProgram = { ...currentProgram };
        const week = updatedProgram.weeks.find(w => w.weekNumber === weekNumber);
        if (week) {
            const day = week.days.find(d => d.name === dayName);
            if (day) {
                const exercise = day.exercises.find(e => e.exerciseId === exerciseId);
                if (exercise) {
                    exercise.alternatives = alternatives;
                    setCurrentProgram(updatedProgram);
                    updateProgramInArray(updatedProgram);
                }
            }
        }
    };

    const removeExerciseFromDay = (weekNumber: number, dayName: string, exerciseId: string) => {
        if (!currentProgram) return;

        const updatedProgram = { ...currentProgram };
        const week = updatedProgram.weeks.find(w => w.weekNumber === weekNumber);
        if (week) {
            const day = week.days.find(d => d.name === dayName);
            if (day) {
                day.exercises = day.exercises.filter(e => e.exerciseId !== exerciseId);
                setCurrentProgram(updatedProgram);
                updateProgramInArray(updatedProgram);
            }
        }
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