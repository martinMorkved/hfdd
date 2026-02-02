import { Link } from "react-router-dom";
import { Button } from "../../components/ui/Button";
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
    return (
        <div className="bg-gray-800 rounded-lg p-4 sm:p-6 border border-gray-700 hover:border-cyan-500 transition-colors">
            <div className="mb-4">
                <h3 className="text-lg sm:text-xl font-bold text-white mb-2">{program.name}</h3>
                {program.description && (
                    <p className="text-gray-300 text-sm mb-3">{program.description}</p>
                )}
                <span className="inline-block px-2 py-1 bg-cyan-600 text-white text-xs rounded-full">
                    {getStructureLabel(program.structure)}
                </span>
            </div>

            <div className="space-y-2 mb-4 sm:mb-6">
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

            <div className="flex flex-wrap gap-2">
                <Link
                    to="/program"
                    state={{ selectedProgramId: program.id }}
                    className="px-3 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition text-center text-sm font-medium"
                >
                    Edit Program
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
