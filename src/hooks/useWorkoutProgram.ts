import { useState } from "react";

export type ProgramStructure =
    | "weekly"        // Traditional 7-day weeks
    | "rotating"      // A, B, C rotation
    | "block"         // Mesocycle blocks
    | "frequency";    // Full body, single template

export type Exercise = {
    id: string;
    name: string;
    description?: string;
    muscleGroup?: string;
};

export type WorkoutExercise = {
    exerciseId: string;
    exerciseName: string;
    sets: number;
    reps: number[];
    comment?: string;
    alternatives?: string[];
};

export type WorkoutDay = {
    id: string;
    name: string;
    exercises: WorkoutExercise[];
};

export type WorkoutWeek = {
    weekNumber: number;
    days: WorkoutDay[];
};

export type WorkoutProgram = {
    id: string;
    name: string;
    description?: string;
    structure: ProgramStructure;
    weeks: WorkoutWeek[];
};

export const useWorkoutProgram = () => {
    const [programs, setPrograms] = useState<WorkoutProgram[]>([]);
    const [currentProgram, setCurrentProgram] = useState<WorkoutProgram | null>(null);
    const [programName, setProgramName] = useState("");
    const [programDescription, setProgramDescription] = useState("");
    const [programStructure, setProgramStructure] = useState<ProgramStructure>("weekly");

    const createNewProgram = () => {
        if (!programName.trim()) return;

        const newProgram: WorkoutProgram = {
            id: Date.now().toString(),
            name: programName,
            description: programDescription,
            structure: programStructure,
            weeks: []
        };

        // Add initial week based on structure
        if (programStructure === "weekly") {
            newProgram.weeks.push({
                weekNumber: 1,
                days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map(day => ({
                    id: day.toLowerCase(),
                    name: day,
                    exercises: []
                }))
            });
        } else if (programStructure === "rotating") {
            newProgram.weeks.push({
                weekNumber: 1,
                days: ["Day A", "Day B", "Day C"].map(day => ({
                    id: day.toLowerCase().replace(" ", ""),
                    name: day,
                    exercises: []
                }))
            });
        } else if (programStructure === "block") {
            newProgram.weeks.push({
                weekNumber: 1,
                days: ["Block 1", "Block 2", "Block 3", "Block 4"].map(day => ({
                    id: day.toLowerCase().replace(" ", ""),
                    name: day,
                    exercises: []
                }))
            });
        } else if (programStructure === "frequency") {
            // For frequency-based programs, we don't use weeks - just one template
            newProgram.weeks.push({
                weekNumber: 1,
                days: ["Full Body Session"].map(day => ({
                    id: day.toLowerCase().replace(" ", ""),
                    name: day,
                    exercises: []
                }))
            });
        }

        setPrograms(prev => [...prev, newProgram]);
        setCurrentProgram(newProgram);
        setProgramName("");
        setProgramDescription("");
        setProgramStructure("weekly");
    };

    const updateProgramInArray = (updatedProgram: WorkoutProgram) => {
        setPrograms(prev => prev.map(p => p.id === updatedProgram.id ? updatedProgram : p));
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
        programStructure,
        setProgramStructure,
        createNewProgram,
        updateProgramInArray,
        selectProgram
    };
}; 