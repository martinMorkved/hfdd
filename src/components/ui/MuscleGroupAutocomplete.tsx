import React, { useState, useRef, useEffect } from "react";
import { XIcon } from "../icons";

interface MuscleGroupAutocompleteProps {
    options: string[]; // Existing muscle groups
    selected: string[]; // Currently selected muscle groups
    onSelect: (selected: string[]) => void;
    placeholder?: string;
    label?: string;
}

export const MuscleGroupAutocomplete: React.FC<MuscleGroupAutocompleteProps> = ({
    options,
    selected,
    onSelect,
    placeholder = "Type to add muscle groups...",
    label
}) => {
    const [inputValue, setInputValue] = useState("");
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [highlightedIndex, setHighlightedIndex] = useState(-1);
    const inputRef = useRef<HTMLInputElement>(null);
    const suggestionsRef = useRef<HTMLDivElement>(null);

    // Filter options based on input (case-insensitive)
    const filteredOptions = options.filter(option =>
        option.toLowerCase().includes(inputValue.toLowerCase()) &&
        !selected.some(s => s.toLowerCase() === option.toLowerCase())
    );

    // Check if input matches an existing option exactly (case-insensitive)
    const exactMatch = options.find(
        opt => opt.toLowerCase() === inputValue.toLowerCase()
    );

    // Check if input is already selected (case-insensitive)
    const isAlreadySelected = selected.some(
        s => s.toLowerCase() === inputValue.trim().toLowerCase()
    );

    // Show "Add new" option if input doesn't match exactly and isn't already selected
    const showAddNew = inputValue.trim() && !exactMatch && !isAlreadySelected;

    // Show suggestions if there are filtered options or if we should show "Add new"
    const shouldShowSuggestions = showSuggestions && inputValue.length > 0 && (filteredOptions.length > 0 || showAddNew);

    // Handle input change
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setInputValue(value);
        setShowSuggestions(true);
        setHighlightedIndex(-1);
    };

    // Handle selecting an option
    const handleSelectOption = (option: string) => {
        // Check if already selected (case-insensitive)
        const normalizedOption = option.trim();
        const isAlreadySelected = selected.some(
            s => s.toLowerCase() === normalizedOption.toLowerCase()
        );

        if (!isAlreadySelected && normalizedOption) {
            // Use the exact case from options if it exists, otherwise use what user typed
            const existingOption = options.find(
                opt => opt.toLowerCase() === normalizedOption.toLowerCase()
            );
            onSelect([...selected, existingOption || normalizedOption]);
        }
        setInputValue("");
        setShowSuggestions(false);
        inputRef.current?.focus();
    };

    // Handle adding new muscle group (when user presses Enter or clicks "Add new")
    const handleAddNew = () => {
        const trimmed = inputValue.trim();
        if (trimmed) {
            // Check if it matches an existing option (case-insensitive)
            const existingOption = options.find(
                opt => opt.toLowerCase() === trimmed.toLowerCase()
            );

            if (existingOption) {
                // Use the existing option with correct casing
                handleSelectOption(existingOption);
            } else {
                // Add as new muscle group
                const isAlreadySelected = selected.some(
                    s => s.toLowerCase() === trimmed.toLowerCase()
                );
                if (!isAlreadySelected) {
                    onSelect([...selected, trimmed]);
                }
                setInputValue("");
                setShowSuggestions(false);
            }
        }
    };

    // Total number of options including "Add new"
    const totalOptions = filteredOptions.length + (showAddNew ? 1 : 0);

    // Handle keyboard navigation
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            e.preventDefault();
            if (highlightedIndex >= 0 && highlightedIndex < filteredOptions.length) {
                handleSelectOption(filteredOptions[highlightedIndex]);
            } else if (highlightedIndex === filteredOptions.length && showAddNew) {
                handleAddNew();
            } else if (showAddNew) {
                handleAddNew();
            } else if (filteredOptions.length > 0) {
                handleSelectOption(filteredOptions[0]);
            }
        } else if (e.key === "ArrowDown") {
            e.preventDefault();
            setShowSuggestions(true);
            setHighlightedIndex(prev =>
                prev < totalOptions - 1 ? prev + 1 : prev
            );
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setHighlightedIndex(prev => (prev > 0 ? prev - 1 : -1));
        } else if (e.key === "Escape") {
            setShowSuggestions(false);
            setHighlightedIndex(-1);
        } else if (e.key === "Backspace" && inputValue === "" && selected.length > 0) {
            // Remove last selected item when backspace is pressed on empty input
            onSelect(selected.slice(0, -1));
        }
    };

    // Handle removing a selected muscle group
    const handleRemove = (groupToRemove: string) => {
        onSelect(selected.filter(g => g !== groupToRemove));
    };

    // Close suggestions when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                suggestionsRef.current &&
                !suggestionsRef.current.contains(event.target as Node) &&
                inputRef.current &&
                !inputRef.current.contains(event.target as Node)
            ) {
                setShowSuggestions(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div className="w-full">
            {label && (
                <div className="text-sm font-medium text-gray-300 mb-2">
                    {label}
                </div>
            )}
            <div className="relative">
                {/* Selected tags */}
                {selected.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-2">
                        {selected.map((group) => (
                            <span
                                key={group}
                                className="inline-flex items-center gap-1 px-3 py-1 bg-cyan-600 text-white rounded-lg text-sm font-medium"
                            >
                                {group}
                                <button
                                    type="button"
                                    onClick={() => handleRemove(group)}
                                    className="hover:text-gray-200 focus:outline-none"
                                    aria-label={`Remove ${group}`}
                                >
                                    <XIcon size={14} />
                                </button>
                            </span>
                        ))}
                    </div>
                )}

                {/* Input field */}
                <div className="relative">
                    <input
                        ref={inputRef}
                        type="text"
                        value={inputValue}
                        onChange={handleInputChange}
                        onKeyDown={handleKeyDown}
                        onFocus={() => setShowSuggestions(true)}
                        placeholder={placeholder}
                        className="w-full border border-gray-600 rounded-lg px-3 py-2 bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 placeholder-gray-400"
                    />

                    {/* Suggestions dropdown */}
                    {shouldShowSuggestions && (
                        <div
                            ref={suggestionsRef}
                            className="absolute z-50 w-full mt-1 bg-gray-800 border border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto"
                        >
                            {filteredOptions.map((option, index) => (
                                <button
                                    key={option}
                                    type="button"
                                    onClick={() => handleSelectOption(option)}
                                    className={`w-full text-left px-4 py-2 hover:bg-gray-700 transition ${index === highlightedIndex
                                            ? "bg-gray-700"
                                            : ""
                                        } ${index === 0 && !showAddNew ? "rounded-t-lg" : ""} ${index === filteredOptions.length - 1 && !showAddNew
                                            ? "rounded-b-lg"
                                            : ""
                                        }`}
                                >
                                    <span className="text-white">{option}</span>
                                </button>
                            ))}
                            {showAddNew && (
                                <button
                                    type="button"
                                    onClick={handleAddNew}
                                    className={`w-full text-left px-4 py-2 hover:bg-gray-700 transition ${highlightedIndex === filteredOptions.length
                                            ? "bg-gray-700"
                                            : ""
                                        } ${filteredOptions.length === 0 ? "rounded-t-lg" : ""} rounded-b-lg`}
                                >
                                    <span className="text-white">
                                        Add "{inputValue.trim()}"
                                    </span>
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
