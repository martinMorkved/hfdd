import { useState } from "react";
import type { Exercise } from "../data/exercises";

// Types for workout program
export type WorkoutDay = {
    id: string;
    name: string;
    exercises: WorkoutExercise[];
};

export type WorkoutExercise = {
    exerciseId: string;
    exerciseName: string;
    sets: number;
    reps: number[];
    comment?: string;
    alternatives?: string[];
};

export type WorkoutWeek = {
    weekNumber: number;
    days: WorkoutDay[];
};

export type WorkoutProgram = {
    id: string;
    name: string;
    description: string;
    weeks: WorkoutWeek[];
};

const defaultDays = [
    "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"
];

export const useWorkoutProgram = () => {
    const [programs, setPrograms] = useState<WorkoutProgram[]>([]);
    const [currentProgram, setCurrentProgram] = useState<WorkoutProgram | null>(null);
    const [programName, setProgramName] = useState("");
    const [programDescription, setProgramDescription] = useState("");

    const createNewProgram = () => {
        const newProgram: WorkoutProgram = {
            id: Date.now().toString(),
            name: programName || "New Workout Program",
            description: programDescription,
            weeks: [{
                weekNumber: 1,
                days: defaultDays.map(day => ({
                    id: day.toLowerCase(),
                    name: day,
                    exercises: []
                }))
            }]
        };
        setCurrentProgram(newProgram);
        setPrograms([...programs, newProgram]);
        setProgramName("");
        setProgramDescription("");
    };

    const updateProgramInArray = (updatedProgram: WorkoutProgram) => {
        const programIndex = programs.findIndex(p => p.id === currentProgram?.id);
        if (programIndex !== -1) {
            const updatedPrograms = [...programs];
            updatedPrograms[programIndex] = updatedProgram;
            setPrograms(updatedPrograms);
        }
    };

    const selectProgram = (program: WorkoutProgram) => {
        setCurrentProgram(program);
    };

    return {
        programs,
        currentProgram,
        setCurrentProgram,
        programName,
        setProgramName,
        programDescription,
        setProgramDescription,
        createNewProgram,
        updateProgramInArray,
        selectProgram
    };
}; 