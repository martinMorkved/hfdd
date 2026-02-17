import React, { useState, useEffect } from "react";
import { MultiSelectFilter } from "../../components/ui/MultiSelectFilter";
import { MuscleGroupAutocomplete } from "../../components/ui/MuscleGroupAutocomplete";
import { EmptyState } from "../../components/ui/EmptyState";
import { ErrorMessage } from "../../components/ui/ErrorMessage";
import { TextInput } from "../../components/ui/TextInput";
import { Button } from "../../components/ui/Button";
import { ConfirmationModal } from "../../components/ui/Modal";
import { supabase } from "../../lib/supabase";
import { ExerciseHistoryButton } from "./ExerciseHistoryButton";
import { useAuth } from "../../contexts/AuthContext";
import { DumbbellIcon, PlusIcon } from "../../components/icons";
import type { Exercise } from "./types";
import { checkExerciseContent } from "./contentCheck";

export const ExerciseLibrary: React.FC = () => {
    const { user } = useAuth();
    const [exercises, setExercises] = useState<Exercise[]>([]);
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [selectedMuscleGroups, setSelectedMuscleGroups] = useState<string[]>([]);
    const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [exerciseToDelete, setExerciseToDelete] = useState<{ id: string; name: string } | null>(null);

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

    // Compute unique muscle groups (handle comma-separated values)
    const muscleGroups = Array.from(new Set(
        exercises
            .flatMap(ex => {
                if (!ex.muscle_group) return [];
                return ex.muscle_group.split(',').map(g => g.trim()).filter(Boolean);
            })
    )) as string[];

    // Filter exercises by selected groups and dedupe by ID
    const filteredExercises = (() => {
        const filtered = selectedGroups.length > 0
            ? exercises.filter(ex => {
                if (!ex.muscle_group) return false;
                const exerciseGroups = ex.muscle_group.split(',').map(g => g.trim());
                return exerciseGroups.some(group => selectedGroups.includes(group));
            })
            : exercises;
        // Deduplicate by ID to prevent React key warnings
        const seen = new Set<string>();
        return filtered.filter(ex => {
            if (seen.has(ex.id)) return false;
            seen.add(ex.id);
            return true;
        });
    })();

    const handleAddExercise = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;

        const contentError = checkExerciseContent({
            name: name.trim(),
            description: description.trim() || null,
            muscle_group: selectedMuscleGroups.length > 0 ? selectedMuscleGroups.join(', ') : null,
        });
        if (contentError) {
            setError(contentError);
            return;
        }

        try {
            setError(null);
            const { data, error } = await supabase
                .from('exercises')
                .insert([
                    {
                        name: name.trim(),
                        description: description.trim() || null,
                        muscle_group: selectedMuscleGroups.length > 0 ? selectedMuscleGroups.join(', ') : null,
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
                setSelectedMuscleGroups([]);
                setError(null);
            }
        } catch (err) {
            console.error('Error adding exercise:', err);
            setError('Failed to add exercise');
        }
    };

    const handleDeleteClick = (id: string, name: string) => {
        setExerciseToDelete({ id, name });
    };

    const handleDeleteConfirm = async () => {
        if (!exerciseToDelete) return;

        try {
            const { error } = await supabase
                .from('exercises')
                .delete()
                .eq('id', exerciseToDelete.id);

            if (error) {
                console.error('Error deleting exercise:', error);
                setError('Failed to delete exercise');
                setExerciseToDelete(null);
                return;
            }

            setExercises(exercises.filter(ex => ex.id !== exerciseToDelete.id));
            setError(null);
            setExerciseToDelete(null);
        } catch (err) {
            console.error('Error deleting exercise:', err);
            setError('Failed to delete exercise');
            setExerciseToDelete(null);
        }
    };


    return (
        <div className="min-h-screen bg-gray-900">
            <div className="w-full max-w-[1100px] mx-auto p-8 bg-gray-900 rounded-xl shadow-lg">
                <div className="flex justify-between items-center mb-8">
                    <h2 className="text-3xl font-bold text-white flex items-center gap-3">
                        <DumbbellIcon size={32} className="text-cyan-400" />
                        Exercise Library
                    </h2>
                </div>

                {error && <ErrorMessage message={error} className="mb-6" />}

                <form onSubmit={handleAddExercise} className="flex flex-col md:flex-row gap-4 mb-8 md:items-center">
                    <TextInput
                        variant="search"
                        placeholder="Exercise name"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        required
                        className="w-full md:flex-1 px-4 py-2"
                    />
                    <TextInput
                        variant="search"
                        placeholder="Description"
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                        className="w-full md:flex-1 px-4 py-2"
                    />
                    <div className="w-full md:flex-1">
                        <MuscleGroupAutocomplete
                            options={muscleGroups}
                            selected={selectedMuscleGroups}
                            onSelect={setSelectedMuscleGroups}
                            placeholder="Type to add muscle groups..."
                        />
                    </div>
                    <Button
                        type="submit"
                        variant="primary"
                        icon={<PlusIcon size={18} />}
                        disabled={loading}
                        className="w-full md:w-auto md:ml-4"
                    >
                        {loading ? 'Adding...' : 'Add Exercise'}
                    </Button>
                </form>

                {/* Loading State */}
                {loading && exercises.length === 0 && (
                    <div className="text-center py-8">
                        <div className="text-cyan-400 text-lg">Loading exercises...</div>
                    </div>
                )}

                {!loading && exercises.length === 0 && (
                    <EmptyState title="No exercises found. Add your first exercise above!" />
                )}

                {/* Exercise List */}
                {!loading && exercises.length > 0 && (
                    <>
                        <MultiSelectFilter
                            options={muscleGroups}
                            selected={selectedGroups}
                            onSelect={setSelectedGroups}
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
                                        {ex.muscle_group && (
                                            <span className="ml-2 text-sm text-gray-300">
                                                ({ex.muscle_group.split(',').map(g => g.trim()).join(', ')})
                                            </span>
                                        )}
                                        <div className="text-gray-200 text-sm mt-1">{ex.description}</div>
                                    </div>
                                    <div className="flex gap-2 mt-4 md:mt-0 md:ml-4">
                                        <ExerciseHistoryButton
                                            exerciseId={ex.id}
                                            exerciseName={ex.name}
                                            variant="icon"
                                        />
                                        <Button
                                            onClick={() => handleDeleteClick(ex.id, ex.name)}
                                            variant="danger"
                                            disabled={loading}
                                        >
                                            Delete
                                        </Button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </>
                )}
            </div>

            {/* Exercise History Modal */}
            {/* The ExerciseHistoryButton component manages its own modal state */}

            {/* Delete Confirmation Modal */}
            <ConfirmationModal
                isOpen={exerciseToDelete !== null}
                onClose={() => setExerciseToDelete(null)}
                onConfirm={handleDeleteConfirm}
                title="Delete Exercise"
                message={`Are you sure you want to delete "${exerciseToDelete?.name}"? This action cannot be undone.`}
                confirmText="Delete"
                cancelText="Cancel"
                confirmButtonStyle="bg-red-600 hover:bg-red-700"
            />
        </div>
    );
};
