import React from "react";

interface MuscleGroupFilterProps {
    muscleGroups: string[];
    selected: string[];
    onSelect: (groups: string[]) => void;
}

export const MuscleGroupFilter: React.FC<MuscleGroupFilterProps> = ({ muscleGroups, selected, onSelect }) => {
    const handleToggle = (group: string) => {
        if (selected.includes(group)) {
            onSelect(selected.filter(g => g !== group));
        } else {
            onSelect([...selected, group]);
        }
    };

    const handleAll = () => {
        onSelect([]);
    };

    return (
        <div className="flex flex-wrap gap-2 mb-6">
            <button
                data-filter="all"
                className={`px-4 py-2 rounded-lg border text-white transition font-semibold ${selected.length === 0 ? "bg-cyan-600 border-cyan-500" : "bg-gray-800 border-gray-600 hover:bg-cyan-700"}`}
                onClick={handleAll}
            >
                All
            </button>
            {muscleGroups.map(group => (
                <button
                    key={group}
                    data-filter={group}
                    className={`px-4 py-2 rounded-lg border text-white transition font-semibold ${selected.includes(group) ? "bg-cyan-600 border-cyan-500" : "bg-gray-800 border-gray-600 hover:bg-cyan-700"}`}
                    onClick={() => handleToggle(group)}
                >
                    {group}
                </button>
            ))}
        </div>
    );
}; 