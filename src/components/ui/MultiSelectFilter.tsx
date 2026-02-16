import React, { useState, useEffect } from "react";
import { ChevronDownIcon } from "../icons";

interface MultiSelectFilterProps {
    options: string[];
    selected: string[];
    onSelect: (selected: string[]) => void;
    label?: string;
}

const MOBILE_BREAKPOINT = 767;

export const MultiSelectFilter: React.FC<MultiSelectFilterProps> = ({
    options,
    selected,
    onSelect,
    label = "Filter by Muscle Group",
}) => {
    const [isMobile, setIsMobile] = useState(false);
    const [filterExpanded, setFilterExpanded] = useState(false);

    useEffect(() => {
        const mq = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT}px)`);
        const update = () => setIsMobile(mq.matches);
        update();
        mq.addEventListener("change", update);
        return () => mq.removeEventListener("change", update);
    }, []);

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

    const filterContent = (
        <>
            <div className="flex flex-wrap gap-2">
                <button
                    data-filter="all"
                    type="button"
                    className={`px-4 py-2 rounded-lg border text-white transition font-semibold ${selected.length === 0 ? "bg-cyan-600 border-cyan-500" : "bg-gray-800 border-gray-600 hover:bg-cyan-700"}`}
                    onClick={handleAll}
                >
                    All
                </button>
                {options.map(option => (
                    <button
                        key={option}
                        data-filter={option}
                        type="button"
                        className={`px-4 py-2 rounded-lg border text-white transition font-semibold ${selected.includes(option) ? "bg-cyan-600 border-cyan-500" : "bg-gray-800 border-gray-600 hover:bg-cyan-700"}`}
                        onClick={() => handleToggle(option)}
                    >
                        {option}
                    </button>
                ))}
            </div>
        </>
    );

    if (isMobile) {
        return (
            <div className="mb-5">
                <div>
                    <button
                        type="button"
                        onClick={() => setFilterExpanded(prev => !prev)}
                        className="flex items-center justify-between w-full px-4 py-3 rounded-lg border border-gray-600 bg-gray-800 text-left text-white font-medium hover:bg-gray-700 transition"
                        aria-expanded={filterExpanded}
                    >
                        <span>
                            {label}
                            {selected.length > 0 && (
                                <span className="ml-2 text-cyan-400">({selected.length})</span>
                            )}
                        </span>
                        <span className="text-gray-400 shrink-0 ml-2 flex items-center">
                            <ChevronDownIcon
                                size={20}
                                className={filterExpanded ? "" : "rotate-[-90deg]"}
                            />
                        </span>
                    </button>
                    {selected.length > 0 && (
                        <button
                            type="button"
                            onClick={handleAll}
                            className="mt-3 py-2 text-sm text-cyan-400 hover:text-cyan-300 font-medium min-h-[44px] flex items-center"
                        >
                            Clear filter
                        </button>
                    )}
                </div>
                {filterExpanded && (
                    <div className="mt-3 mb-4">
                        {filterContent}
                    </div>
                )}
            </div>
        );
    }

    return (
        <div>
            {label && (
                <div className="text-sm font-medium text-gray-300 mb-2">
                    {label}
                </div>
            )}
            <div className="mb-6">
                {filterContent}
            </div>
        </div>
    );
};
