// Shared exercises data (pretend database)
export type Exercise = {
    id: string;
    name: string;
    description?: string;
    muscleGroup?: string;
};

export const initialExercises: Exercise[] = [
    { id: "1", name: "Push Up", description: "A basic upper body exercise.", muscleGroup: "Chest" },
    { id: "2", name: "Squat", description: "A basic lower body exercise.", muscleGroup: "Legs" },
    { id: "3", name: "Pull Up", description: "Upper body pulling exercise.", muscleGroup: "Back" },
    { id: "4", name: "Deadlift", description: "Compound lower body exercise.", muscleGroup: "Legs" },
    { id: "5", name: "Bench Press", description: "Chest pressing exercise.", muscleGroup: "Chest" },
    { id: "6", name: "Overhead Press", description: "Shoulder pressing exercise.", muscleGroup: "Shoulders" },
    { id: "7", name: "Bent Over Row", description: "Back rowing exercise.", muscleGroup: "Back" },
    { id: "8", name: "Lunges", description: "Unilateral leg exercise.", muscleGroup: "Legs" },
    { id: "9", name: "Dips", description: "Tricep and chest exercise.", muscleGroup: "Arms" },
    { id: "10", name: "Plank", description: "Core stability exercise.", muscleGroup: "Core" },
    { id: "11", name: "Burpees", description: "Full body conditioning exercise.", muscleGroup: "Full Body" },
    { id: "12", name: "Mountain Climbers", description: "Cardio and core exercise.", muscleGroup: "Core" },
    { id: "13", name: "Jump Squats", description: "Explosive leg exercise.", muscleGroup: "Legs" },
    { id: "14", name: "Diamond Push Ups", description: "Tricep-focused push up variation.", muscleGroup: "Arms" },
    { id: "15", name: "Inverted Rows", description: "Bodyweight back exercise.", muscleGroup: "Back" },
]; 