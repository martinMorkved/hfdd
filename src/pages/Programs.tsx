import { useState } from "react";
import { useWorkoutProgram } from "../hooks/useWorkoutProgram";
import { Link } from "react-router-dom";
import { ConfirmationModal } from "../components/Modal";

export default function Programs() {
    const { programs, loading, deleteProgram } = useWorkoutProgram();
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [programToDelete, setProgramToDelete] = useState<{ id: string; name: string } | null>(null);

    const getStructureLabel = (structure: string) => {
        switch (structure) {
            case "weekly": return "Weekly (7-day cycles)";
            case "rotating": return "Rotating (A/B/C days)";
            case "block": return "Block-based (Mesocycles)";
            case "frequency": return "Frequency-based (Full body)";
            default: return structure;
        }
    };

    const getTotalExercises = (program: any) => {
        return program.weeks.reduce((total: number, week: any) => {
            return total + week.days.reduce((dayTotal: number, day: any) => {
                return dayTotal + day.exercises.length;
            }, 0);
        }, 0);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center">
                <div className="text-cyan-400 text-xl">Loading programs...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-900">
            <div className="p-8">
                <div className="max-w-[1100px] mx-auto">
                    <div className="flex items-center justify-between mb-8">
                        <h1 className="text-3xl font-bold text-white">My Programs</h1>
                        <Link
                            to="/program"
                            className="px-6 py-3 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition font-semibold"
                        >
                            Create New Program
                        </Link>
                    </div>

                    {programs.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="text-gray-400 text-lg mb-4">No programs created yet</div>
                            <p className="text-gray-500 mb-6">Start by creating your first workout program</p>
                            <Link
                                to="/program"
                                className="px-6 py-3 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition font-semibold"
                            >
                                Create Your First Program
                            </Link>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {programs.map((program) => (
                                <div
                                    key={program.id}
                                    className="bg-gray-800 rounded-lg p-6 border border-gray-700 hover:border-cyan-500 transition-colors"
                                >
                                    <div className="mb-4">
                                        <h3 className="text-xl font-bold text-white mb-2">{program.name}</h3>
                                        {program.description && (
                                            <p className="text-gray-300 text-sm mb-3">{program.description}</p>
                                        )}
                                        <div className="flex items-center gap-2 mb-3">
                                            <span className="px-2 py-1 bg-cyan-600 text-white text-xs rounded-full">
                                                {getStructureLabel(program.structure)}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="space-y-2 mb-6">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-400">Weeks:</span>
                                            <span className="text-white font-medium">{program.weeks.length}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-400">Total Exercises:</span>
                                            <span className="text-white font-medium">{getTotalExercises(program)}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-400">Days per Week:</span>
                                            <span className="text-white font-medium">
                                                {program.weeks[0]?.days.length || 0}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex gap-3">
                                        <Link
                                            to={`/program`}
                                            state={{ selectedProgramId: program.id }}
                                            className="flex-1 px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition text-center text-sm font-medium"
                                        >
                                            Edit Program
                                        </Link>
                                        <button
                                            onClick={() => {
                                                setProgramToDelete({ id: program.id, name: program.name });
                                                setShowDeleteModal(true);
                                            }}
                                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm font-medium"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Delete Confirmation Modal */}
                    <ConfirmationModal
                        isOpen={showDeleteModal}
                        onClose={() => {
                            setShowDeleteModal(false);
                            setProgramToDelete(null);
                        }}
                        onConfirm={() => {
                            if (programToDelete) {
                                deleteProgram(programToDelete.id);
                            }
                        }}
                        title="Delete Program"
                        message={`Are you sure you want to delete "${programToDelete?.name}"? This action cannot be undone.`}
                        confirmText="Delete"
                        confirmButtonStyle="bg-red-600 hover:bg-red-700"
                    />
                </div>
            </div>
        </div>
    );
}
