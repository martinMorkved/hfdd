import React, { useState, useEffect } from "react";
import { MultiSelectFilter } from "./MultiSelectFilterProps";
import { supabase } from "../lib/supabase";

type Exercise = {
    id: string;
    name: string;
    description?: string;
    muscle_group?: string;
    created_at?: string;
    updated_at?: string;
};

interface ExerciseSelectorProps {
    onExerciseSelect: (exercise: Exercise) => void;
    onClose: () => void;
}

export const ExerciseSelector: React.FC<ExerciseSelectorProps> = ({ onExerciseSelect, onClose }) => {
    const [exercises, setExercises] = useState<Exercise[]>([]);
    const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState("");

    // Load exercises from Supabase on component mount
    useEffect(() => {
        console.log('ExerciseSelector: Loading exercises...');
        loadExercises();
    }, []);

    const loadExercises = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('exercises')
                .select('*')
                .order('name');

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

    // Filter exercises by selected groups and search term
    const filteredExercises = exercises.filter(ex => {
        const matchesGroup = selectedGroups.length === 0 ||
            (ex.muscle_group && selectedGroups.includes(ex.muscle_group));
        const matchesSearch = ex.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (ex.description && ex.description.toLowerCase().includes(searchTerm.toLowerCase()));
        return matchesGroup && matchesSearch;
    });

    const handleExerciseClick = (exercise: Exercise) => {
        onExerciseSelect(exercise);
    };

    return (
        <div className="w-full max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-white">Choose Exercise</h2>
                <button
                    onClick={onClose}
                    className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition"
                >
                    Close
                </button>
            </div>

            {/* Error Message */}
            {error && (
                <div className="mb-6 p-4 bg-red-900/20 border border-red-500 rounded-lg">
                    <p className="text-red-400">{error}</p>
                </div>
            )}

            {/* Search Bar */}
            <div className="mb-6">
                <input
                    type="text"
                    placeholder="Search exercises..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full border border-gray-400 rounded-lg px-4 py-3 bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 placeholder-gray-400"
                />
            </div>

            {/* Muscle Group Filter */}
            {muscleGroups.length > 0 && (
                <div className="mb-6">
                    <MultiSelectFilter
                        options={muscleGroups}
                        selected={selectedGroups}
                        onSelect={setSelectedGroups}
                        label="Filter by Muscle Groups"
                    />
                </div>
            )}

            {/* Loading State */}
            {loading && (
                <div className="text-center py-8">
                    <div className="text-cyan-400 text-lg">Loading exercises...</div>
                </div>
            )}

            {/* No Exercises Message */}
            {!loading && exercises.length === 0 && (
                <div className="text-center py-8">
                    <div className="text-gray-400 text-lg">No exercises found. Add exercises in the Exercise Library first!</div>
                </div>
            )}

            {/* No Results Message */}
            {!loading && exercises.length > 0 && filteredExercises.length === 0 && (
                <div className="text-center py-8">
                    <div className="text-gray-400 text-lg">No exercises match your search criteria.</div>
                </div>
            )}

            {/* Exercise List */}
            {!loading && filteredExercises.length > 0 && (
                <div className="max-h-96 overflow-y-auto">
                    <div className="grid gap-3">
                        {filteredExercises.map(ex => (
                            <button
                                key={ex.id}
                                onClick={() => handleExerciseClick(ex)}
                                className="w-full text-left bg-gray-800 rounded-lg p-4 hover:bg-gray-700 transition border border-gray-700 hover:border-cyan-500"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                        <div className="font-semibold text-white text-lg">{ex.name}</div>
                                        {ex.muscle_group && (
                                            <div className="text-sm text-cyan-400 mt-1">{ex.muscle_group}</div>
                                        )}
                                        {ex.description && (
                                            <div className="text-gray-300 text-sm mt-1">{ex.description}</div>
                                        )}
                                    </div>
                                    <div className="text-gray-400 text-sm ml-4">
                                        Click to select →
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Results Count */}
            {!loading && filteredExercises.length > 0 && (
                <div className="mt-4 text-center text-gray-400 text-sm">
                    Showing {filteredExercises.length} of {exercises.length} exercises
                </div>
            )}
        </div>
    );
};
