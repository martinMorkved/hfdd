import { useState } from "react";
import type { Exercise } from "../exercises/types";

export const useDragAndDrop = (
    addExerciseToDay: (exercise: Exercise, weekNumber: number, dayName: string) => void,
    removeExerciseFromDay: (weekNumber: number, dayName: string, exerciseId: string) => void
) => {
    const [draggedExercise, setDraggedExercise] = useState<Exercise | null>(null);
    const [dragOverDay, setDragOverDay] = useState<{ weekNumber: number, dayName: string } | null>(null);
    const [draggedWorkoutExercise, setDraggedWorkoutExercise] = useState<{ weekNumber: number, dayName: string, exerciseId: string, workoutExerciseId: string } | null>(null);
    const [showRemoveZone, setShowRemoveZone] = useState(false);

    const handleDragStart = (exercise: Exercise) => {
        setDraggedExercise(exercise);
    };

    const handleDragOver = (e: React.DragEvent, weekNumber: number, dayName: string) => {
        e.preventDefault();
        setDragOverDay({ weekNumber, dayName });
    };

    const handleDragLeave = () => {
        setDragOverDay(null);
    };

    const handleWorkoutExerciseDragStart = (weekNumber: number, dayName: string, exerciseId: string, workoutExerciseId: string) => {
        setDraggedWorkoutExercise({ weekNumber, dayName, exerciseId, workoutExerciseId });
        setShowRemoveZone(true);
    };

    const handleWorkoutExerciseDragEnd = () => {
        setDraggedWorkoutExercise(null);
        setShowRemoveZone(false);
    };

    const handleRemoveZoneDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    const handleRemoveZoneDrop = () => {
        if (draggedWorkoutExercise) {
            removeExerciseFromDay(
                draggedWorkoutExercise.weekNumber,
                draggedWorkoutExercise.dayName,
                draggedWorkoutExercise.exerciseId
            );
            setDraggedWorkoutExercise(null);
            setShowRemoveZone(false);
        }
    };

    const handleDrop = (weekNumber: number, dayName: string) => {
        if (draggedExercise) {
            addExerciseToDay(draggedExercise, weekNumber, dayName);
            setDraggedExercise(null);
            setDragOverDay(null);
        }
        if (draggedWorkoutExercise) {
            setDraggedWorkoutExercise(null);
            setShowRemoveZone(false);
        }
    };

    return {
        draggedExercise,
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
    };
}; 