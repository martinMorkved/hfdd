import React, { useState } from "react";

// Define the Exercise type
export type Exercise = {
    id: string;
    name: string;
    description?: string;
    muscleGroup?: string;
};

const initialExercises: Exercise[] = [
    { id: "1", name: "Push Up", description: "A basic upper body exercise.", muscleGroup: "Chest" },
    { id: "2", name: "Squat", description: "A basic lower body exercise.", muscleGroup: "Legs" },
];

export const ExerciseLibrary: React.FC = () => {
    const [exercises, setExercises] = useState<Exercise[]>(initialExercises);
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [muscleGroup, setMuscleGroup] = useState("");

    const handleAddExercise = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;
        const newExercise: Exercise = {
            id: Date.now().toString(),
            name,
            description,
            muscleGroup,
        };
        setExercises([...exercises, newExercise]);
        setName("");
        setDescription("");
        setMuscleGroup("");
    };

    const handleDelete = (id: string) => {
        setExercises(exercises.filter(ex => ex.id !== id));
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-900">
            <div className="w-full max-w-[1100px] p-8 bg-gray-900 rounded-xl shadow-lg">
                <h2 className="text-3xl font-bold mb-8 text-white text-center">Exercise Library</h2>
                <form onSubmit={handleAddExercise} className="flex flex-row gap-4 mb-8 items-center">
                    <input
                        type="text"
                        placeholder="Exercise name"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        required
                        className="flex-1 border border-gray-400 rounded-lg px-4 py-2 bg-gray-900 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 placeholder-gray-400"
                    />
                    <input
                        type="text"
                        placeholder="Description"
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                        className="flex-1 border border-gray-400 rounded-lg px-4 py-2 bg-gray-900 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 placeholder-gray-400"
                    />
                    <input
                        type="text"
                        placeholder="Muscle group"
                        value={muscleGroup}
                        onChange={e => setMuscleGroup(e.target.value)}
                        className="flex-1 border border-gray-400 rounded-lg px-4 py-2 bg-gray-900 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 placeholder-gray-400"
                    />
                    <button type="submit" className="ml-4 px-6 py-2 bg-cyan-600 text-white rounded-lg border border-cyan-500 hover:bg-cyan-700 transition font-semibold">Add Exercise</button>
                </form>
                <ul className="space-y-4">
                    {exercises.map(ex => (
                        <li key={ex.id} className="bg-gray-800 rounded-lg p-6 flex flex-col md:flex-row md:items-center md:justify-between border border-gray-700">
                            <div className="flex-1 text-left">
                                <strong className="text-lg text-white">{ex.name}</strong>
                                {ex.muscleGroup && <span className="ml-2 text-sm text-gray-300">({ex.muscleGroup})</span>}
                                <div className="text-gray-200 text-sm mt-1">{ex.description}</div>
                            </div>
                            <button
                                onClick={() => handleDelete(ex.id)}
                                className="mt-4 md:mt-0 md:ml-4 px-4 py-2 bg-cyan-600 text-white rounded-lg border border-cyan-500 hover:bg-cyan-700 transition font-semibold self-end md:self-auto"
                            >
                                Delete
                            </button>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}; 