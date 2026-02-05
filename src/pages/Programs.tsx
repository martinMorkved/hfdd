import { useState } from "react";
import { useWorkoutProgram } from "../features/programs/useWorkoutProgram";
import { Link } from "react-router-dom";
import { ConfirmationModal } from "../components/ui/Modal";
import { LoadingScreen } from "../components/ui/LoadingScreen";
import { PageHeader } from "../components/ui/PageHeader";
import { PageLayout } from "../components/ui/PageLayout";
import { EmptyState } from "../components/ui/EmptyState";
import { Button } from "../components/ui/Button";
import { ProgramCard } from "../features/programs";
import { getTotalExercises } from "../features/programs/utils";
import { EditIcon } from "../components/icons";

export default function Programs() {
    const { programs, loading, deleteProgram, activeProgram, activateProgram, deactivateProgram } = useWorkoutProgram();
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [programToDelete, setProgramToDelete] = useState<{ id: string; name: string } | null>(null);
    const [showReplaceModal, setShowReplaceModal] = useState(false);
    const [programToActivate, setProgramToActivate] = useState<{ id: string; name: string } | null>(null);

    if (loading) {
        return <LoadingScreen message="Loading programs..." />;
    }

    return (
        <PageLayout maxWidth="max-w-[1100px]">
            <PageHeader
                title="My Programs"
                actions={
                    <Link to="/program" className="inline-block">
                        <Button variant="primary" icon={<EditIcon size={18} />}>
                            Create New Program
                        </Button>
                    </Link>
                }
            />

            {/* Active Program Display */}
            {activeProgram && (
                <div className="mb-6 sm:mb-8 p-4 sm:p-6 bg-gradient-to-r from-cyan-900 to-blue-900 rounded-lg border border-cyan-500">
                    <span className="inline-block px-3 py-1 bg-cyan-500 text-white text-xs font-semibold rounded-full mb-3">
                        ACTIVE PROGRAM
                    </span>
                    <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">{activeProgram.name}</h2>

                    {activeProgram.description && (
                        <p className="text-cyan-200 text-sm mb-4">{activeProgram.description}</p>
                    )}

                    <div className="flex flex-col sm:flex-row sm:gap-3 gap-2 mb-4 text-sm text-cyan-200">
                        <div className="flex items-center gap-2">
                            <span className="text-cyan-400">•</span>
                            <span>{activeProgram.weeks.length} weeks</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-cyan-400">•</span>
                            <span>{activeProgram.weeks[0]?.days.length || 0} days/week</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-cyan-400">•</span>
                            <span>{getTotalExercises(activeProgram)} exercises</span>
                        </div>
                    </div>

                    <Button
                        onClick={() => deactivateProgram()}
                        variant="danger"
                    >
                        Deactivate
                    </Button>
                </div>
            )}

            {programs.length === 0 ? (
                <EmptyState
                    title="No programs created yet"
                    description="Start by creating your first workout program"
                    action={
                        <Link to="/program" className="inline-block">
                            <Button variant="primary" icon={<EditIcon size={18} />}>
                                Create Your First Program
                            </Button>
                        </Link>
                    }
                />
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                    {programs.map((program) => (
                        <ProgramCard
                            key={program.id}
                            program={program}
                            isActive={activeProgram?.id === program.id}
                            onActivate={(id, name) => {
                                if (activeProgram) {
                                    setProgramToActivate({ id, name });
                                    setShowReplaceModal(true);
                                } else {
                                    activateProgram(id);
                                }
                            }}
                            onDelete={(id, name) => {
                                setProgramToDelete({ id, name });
                                setShowDeleteModal(true);
                            }}
                        />
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
                        const id = programToDelete.id;
                        setShowDeleteModal(false);
                        setProgramToDelete(null);
                        deleteProgram(id);
                    }
                }}
                title="Delete Program"
                message={`Are you sure you want to delete "${programToDelete?.name}"? This action cannot be undone.`}
                confirmText="Delete"
                confirmButtonStyle="bg-red-600 hover:bg-red-700"
            />

            {/* Replace Active Program Modal */}
            <ConfirmationModal
                isOpen={showReplaceModal}
                onClose={() => {
                    setShowReplaceModal(false);
                    setProgramToActivate(null);
                }}
                onConfirm={() => {
                    if (programToActivate) {
                        activateProgram(programToActivate.id);
                        setShowReplaceModal(false);
                        setProgramToActivate(null);
                    }
                }}
                title="Replace Active Program"
                message={`You already have "${activeProgram?.name}" as your active program. Would you like to deactivate it and activate "${programToActivate?.name}" instead?`}
                confirmText="Replace Program"
                confirmButtonStyle="bg-green-600 hover:bg-green-700"
            />
        </PageLayout>
    );
}
