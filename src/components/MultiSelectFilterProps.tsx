import React from "react";

interface MultiSelectFilterProps {
    options: string[];
    selected: string[];
    onSelect: (selected: string[]) => void;
    label?: string;
}

export const MultiSelectFilter: React.FC<MultiSelectFilterProps> = ({
    options,
    selected,
    onSelect,
}) => {
    const handleToggle = (option: string) => {
        if (selected.includes(option)) {
            onSelect(selected.filter(o => o !== option));
        } else {
            onSelect([...selected, option]);
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
            {options.map(option => (
                <button
                    key={option}
                    data-filter={option}
                    className={`px-4 py-2 rounded-lg border text-white transition font-semibold ${selected.includes(option) ? "bg-cyan-600 border-cyan-500" : "bg-gray-800 border-gray-600 hover:bg-cyan-700"}`}
                    onClick={() => handleToggle(option)}
                >
                    {option}
                </button>
            ))}
        </div>
    );
}; 