import React, { useState, useEffect } from "react";
import { MultiSelectFilter } from "./MultiSelectFilterProps";
import { supabase } from "../lib/supabase";
import { seedExercises } from "../utils/seedData";
import { useAuth } from "../contexts/AuthContext";

// Updated Exercise type to match database schema
type Exercise = {
    id: string;
    name: string;
    description?: string;
    muscle_group?: string;
    created_at?: string;
    updated_at?: string;
};

export const ExerciseLibrary: React.FC = () => {
    const { user } = useAuth();
    const [exercises, setExercises] = useState<Exercise[]>([]);
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [muscleGroup, setMuscleGroup] = useState("");
    const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Load exercises from Supabase on component mount
    useEffect(() => {
        loadExercises();
    }, []);

    const loadExercises = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('exercises')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error loading exercises:', error);
                setError('Failed to load exercises');
                return;
            }

            setExercises(data || []);
        } catch (err) {
            console.error('Error loading exercises:', err);
            setError('Failed to load exercises');
        } finally {
            setLoading(false);
        }
    };

    // Compute unique muscle groups
    const muscleGroups = Array.from(new Set(exercises.map(ex => ex.muscle_group).filter(Boolean))) as string[];

    // Filter exercises by selected groups
    const filteredExercises = selectedGroups.length > 0
        ? exercises.filter(ex => ex.muscle_group && selectedGroups.includes(ex.muscle_group))
        : exercises;

    const handleAddExercise = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;

        try {
            const { data, error } = await supabase
                .from('exercises')
                .insert([
                    {
                        name: name.trim(),
                        description: description.trim() || null,
                        muscle_group: muscleGroup.trim() || null,
                        user_id: user?.id || null
                    }
                ])
                .select();

            if (error) {
                console.error('Error adding exercise:', error);
                setError('Failed to add exercise');
                return;
            }

            if (data && data.length > 0) {
                setExercises([data[0], ...exercises]);
                setName("");
                setDescription("");
                setMuscleGroup("");
                setError(null);
            }
        } catch (err) {
            console.error('Error adding exercise:', err);
            setError('Failed to add exercise');
        }
    };

    const handleDelete = async (id: string) => {
        try {
            const { error } = await supabase
                .from('exercises')
                .delete()
                .eq('id', id);

            if (error) {
                console.error('Error deleting exercise:', error);
                setError('Failed to delete exercise');
                return;
            }

            setExercises(exercises.filter(ex => ex.id !== id));
            setError(null);
        } catch (err) {
            console.error('Error deleting exercise:', err);
            setError('Failed to delete exercise');
        }
    };

    const handleSeedData = async () => {
        try {
            setLoading(true);
            const result = await seedExercises();

            if (result.success) {
                // Reload exercises after seeding
                await loadExercises();
                setError(null);
            } else {
                setError(result.error || 'Failed to seed data');
            }
        } catch (err) {
            console.error('Error seeding data:', err);
            setError('Failed to seed data');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-900">
            <div className="w-full max-w-[1100px] p-8 bg-gray-900 rounded-xl shadow-lg">
                <div className="flex justify-between items-center mb-8">
                    <h2 className="text-3xl font-bold text-white">Exercise Library</h2>
                    <button
                        onClick={handleSeedData}
                        disabled={loading}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg border border-green-500 hover:bg-green-700 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Loading...' : 'Add Sample Data'}
                    </button>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="mb-6 p-4 bg-red-900/20 border border-red-500 rounded-lg">
                        <p className="text-red-400">{error}</p>
                    </div>
                )}

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
                    <button
                        type="submit"
                        disabled={loading}
                        className="ml-4 px-6 py-2 bg-cyan-600 text-white rounded-lg border border-cyan-500 hover:bg-cyan-700 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Adding...' : 'Add Exercise'}
                    </button>
                </form>

                {/* Loading State */}
                {loading && exercises.length === 0 && (
                    <div className="text-center py-8">
                        <div className="text-cyan-400 text-lg">Loading exercises...</div>
                    </div>
                )}

                {/* No Exercises Message */}
                {!loading && exercises.length === 0 && (
                    <div className="text-center py-8">
                        <div className="text-gray-400 text-lg">No exercises found. Add your first exercise above!</div>
                    </div>
                )}

                {/* Exercise List */}
                {!loading && exercises.length > 0 && (
                    <>
                        <MultiSelectFilter
                            options={muscleGroups}
                            selected={selectedGroups}
                            onSelect={setSelectedGroups}
                            label="Muscle Groups"
                        />
                        <ul className="space-y-4">
                            {filteredExercises.map(ex => (
                                <li
                                    key={ex.id}
                                    data-filter={ex.muscle_group}
                                    className="bg-gray-800 rounded-lg p-6 flex flex-col md:flex-row md:items-center md:justify-between border border-gray-700"
                                >
                                    <div className="flex-1 text-left">
                                        <strong className="text-lg text-white">{ex.name}</strong>
                                        {ex.muscle_group && <span className="ml-2 text-sm text-gray-300">({ex.muscle_group})</span>}
                                        <div className="text-gray-200 text-sm mt-1">{ex.description}</div>
                                    </div>
                                    <button
                                        onClick={() => handleDelete(ex.id)}
                                        disabled={loading}
                                        className="mt-4 md:mt-0 md:ml-4 px-4 py-2 bg-red-600 text-white rounded-lg border border-red-500 hover:bg-red-700 transition font-semibold self-end md:self-auto disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Delete
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </>
                )}
            </div>
        </div>
    );
}; 