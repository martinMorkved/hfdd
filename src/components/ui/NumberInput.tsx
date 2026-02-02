import React, { useState, useEffect } from 'react';

interface NumberInputProps {
    value: number;
    onChange: (value: number) => void;
    min?: number;
    max?: number;
    step?: number;
    placeholder?: string;
    className?: string;
    disabled?: boolean;
}

export const NumberInput: React.FC<NumberInputProps> = ({
    value,
    onChange,
    min = 0,
    max,
    placeholder,
    className = "",
    disabled = false
}) => {
    const [displayValue, setDisplayValue] = useState(value.toString());

    // Update display value when prop value changes
    useEffect(() => {
        setDisplayValue(value.toString());
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const inputValue = e.target.value;

        // Allow empty string for better UX
        if (inputValue === '') {
            setDisplayValue('');
            return;
        }

        // Only allow numbers and decimal points
        if (!/^\d*\.?\d*$/.test(inputValue)) {
            return;
        }

        setDisplayValue(inputValue);
    };

    const handleBlur = () => {
        // Convert to number and validate
        const numValue = parseFloat(displayValue) || 0;

        // Apply min/max constraints
        let finalValue = numValue;
        if (min !== undefined && finalValue < min) {
            finalValue = min;
        }
        if (max !== undefined && finalValue > max) {
            finalValue = max;
        }

        // Update the display value to show the final value
        setDisplayValue(finalValue.toString());

        // Only call onChange if the value actually changed
        if (finalValue !== value) {
            onChange(finalValue);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        // Allow: backspace, delete, tab, escape, enter, and arrow keys
        if ([8, 9, 27, 13, 37, 38, 39, 40].includes(e.keyCode)) {
            return;
        }

        // Allow decimal point
        if (e.key === '.') {
            return;
        }

        // Allow numbers
        if (e.key >= '0' && e.key <= '9') {
            return;
        }

        // Prevent other keys
        e.preventDefault();
    };

    return (
        <input
            type="text"
            value={displayValue}
            onChange={handleChange}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className={className}
            disabled={disabled}
        />
    );
};
