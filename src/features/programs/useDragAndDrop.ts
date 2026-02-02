import { useState } from "react";
import type { Exercise } from "../exercises/types";

export const useDragAndDrop = (
    addExerciseToDay: (exercise: Exercise, weekNumber: number, dayName: string) => void,
    removeExerciseFromDay: (weekNumber: number, dayName: string, exerciseId: string) => void
) => {
    const [draggedExercise, setDraggedExercise] = useState<Exercise | null>(null);
    const [dragOverDay, setDragOverDay] = useState<{ weekNumber: number, dayName: string } | null>(null);
    const [draggedWorkoutExercise, setDraggedWorkoutExercise] = useState<{ weekNumber: number, dayName: string, exerciseId: string } | null>(null);
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

    const handleWorkoutExerciseDragStart = (weekNumber: number, dayName: string, exerciseId: string) => {
        setDraggedWorkoutExercise({ weekNumber, dayName, exerciseId });
        setShowRemoveZone(true);
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
        handleRemoveZoneDragOver,
        handleRemoveZoneDrop,
        handleDrop
    };
}; 