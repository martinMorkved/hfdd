import { Link } from "react-router-dom";

interface Program {
    id: string;
    name: string;
    description?: string;
    structure: string;
    weeks: { days: { exercises: any[] }[] }[];
}

interface ProgramCardProps {
    program: Program;
    isActive: boolean;
    onActivate: (id: string, name: string) => void;
    onDelete: (id: string, name: string) => void;
}

const getStructureLabel = (structure: string) => {
    switch (structure) {
        case "weekly": return "Weekly (7-day cycles)";
        case "rotating": return "Rotating (A/B/C days)";
        case "block": return "Block-based (Mesocycles)";
        case "frequency": return "Frequency-based (Full body)";
        default: return structure;
    }
};

const getTotalExercises = (program: Program) => {
    return program.weeks.reduce((total, week) => {
        return total + week.days.reduce((dayTotal, day) => {
            return dayTotal + day.exercises.length;
        }, 0);
    }, 0);
};

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
                    <button
                        disabled
                        className="px-3 py-2 bg-green-600 text-white rounded-lg text-sm font-medium cursor-not-allowed"
                    >
                        Active
                    </button>
                ) : (
                    <button
                        onClick={() => onActivate(program.id, program.name)}
                        className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm font-medium"
                    >
                        Activate
                    </button>
                )}
                <button
                    onClick={() => onDelete(program.id, program.name)}
                    className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm font-medium"
                >
                    Delete
                </button>
            </div>
        </div>
    );
};
