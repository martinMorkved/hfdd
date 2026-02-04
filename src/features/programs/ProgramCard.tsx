import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "../../components/ui/Button";
import { InfoIcon, EditIcon } from "../../components/icons";
import { getStructureLabel, getTotalExercises } from "./utils";

interface Program {
    id: string;
    name: string;
    description?: string;
    structure: string;
    weeks: { days: { exercises: unknown[] }[] }[];
}

interface ProgramCardProps {
    program: Program;
    isActive: boolean;
    onActivate: (id: string, name: string) => void;
    onDelete: (id: string, name: string) => void;
}

export const ProgramCard: React.FC<ProgramCardProps> = ({
    program,
    isActive,
    onActivate,
    onDelete,
}) => {
    const [showDescription, setShowDescription] = useState(false);
    const hasDescription = Boolean(program.description?.trim());

    return (
        <div className="bg-gray-800 rounded-lg p-4 sm:p-6 border border-gray-700 hover:border-cyan-500 transition-colors flex flex-col h-full">
            <div className="mb-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="text-lg sm:text-xl font-bold text-white">{program.name}</h3>
                    {hasDescription && (
                        <button
                            type="button"
                            onClick={() => setShowDescription((prev) => !prev)}
                            className="shrink-0 p-1 rounded text-gray-400 hover:text-cyan-400 hover:bg-gray-700 transition"
                            title={showDescription ? "Hide description" : "Show description"}
                            aria-label={showDescription ? "Hide description" : "Show description"}
                        >
                            <InfoIcon size={18} className={showDescription ? "text-cyan-400" : ""} />
                        </button>
                    )}
                </div>
                <span className="inline-block px-2 py-1 bg-cyan-600 text-white text-xs rounded-full mb-2">
                    {getStructureLabel(program.structure)}
                </span>
            </div>

            {showDescription && hasDescription ? (
                <div className="flex-1 min-h-[5.5rem] mb-4 sm:mb-6">
                    <p className="text-gray-300 text-sm">{program.description}</p>
                </div>
            ) : (
                <div className="space-y-2 mb-4 sm:mb-6 flex-1">
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
            )}

            <div className="flex flex-wrap gap-2">
                <Link
                    to="/program"
                    state={{ selectedProgramId: program.id }}
                    className="inline-block"
                >
                    <Button variant="primary" icon={<EditIcon size={18} />}>
                        Edit Program
                    </Button>
                </Link>
                {isActive ? (
                    <Button variant="success" disabled>
                        Active
                    </Button>
                ) : (
                    <Button
                        variant="success"
                        onClick={() => onActivate(program.id, program.name)}
                    >
                        Activate
                    </Button>
                )}
                <Button
                    variant="danger"
                    onClick={() => onDelete(program.id, program.name)}
                >
                    Delete
                </Button>
            </div>
        </div>
    );
};
