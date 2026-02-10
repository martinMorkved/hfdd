import React, { useState } from 'react';
import { ExerciseHistory } from './ExerciseHistory';

interface ExerciseHistoryButtonProps {
    exerciseId: string;
    exerciseName: string;
    variant?: 'button' | 'text' | 'icon';
    className?: string;
    /** When logging in a program, pass these so history shows "last time for this day in program" */
    programId?: string;
    programName?: string;
    dayName?: string;
}

export const ExerciseHistoryButton: React.FC<ExerciseHistoryButtonProps> = ({
    exerciseId,
    exerciseName,
    variant = 'button',
    className = '',
    programId,
    programName,
    dayName
}) => {
    const [showHistory, setShowHistory] = useState(false);

    const handleClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setShowHistory(true);
    };

    const renderButton = () => {
        switch (variant) {
            case 'text':
                return (
                    <button
                        onClick={handleClick}
                        className={`text-cyan-400 hover:text-cyan-300 text-sm underline transition ${className}`}
                    >
                        View History
                    </button>
                );
            case 'icon':
                return (
                    <button
                        onClick={handleClick}
                        className={`text-cyan-400 hover:text-cyan-300 transition ${className}`}
                        title="View Exercise History"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                    </button>
                );
            default:
                return (
                    <button
                        onClick={handleClick}
                        className={`px-3 py-1 bg-cyan-600 text-white rounded text-sm border border-cyan-500 hover:bg-cyan-700 transition font-medium ${className}`}
                    >
                        History
                    </button>
                );
        }
    };

    return (
        <>
            {renderButton()}

            <ExerciseHistory
                exerciseId={exerciseId}
                exerciseName={exerciseName}
                isOpen={showHistory}
                onClose={() => setShowHistory(false)}
                programId={programId}
                programName={programName}
                dayName={dayName}
            />
        </>
    );
};
