import React from "react";

/** Compact numeric-style input for reps/sets. Use type="text" + inputMode="numeric" so parent can control string value and parse on blur. */
interface RepInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type" | "className"> {
    className?: string;
}

const baseClasses =
    "w-16 h-9 border border-gray-600 rounded-lg px-2 py-0 bg-gray-800 text-white text-sm text-center focus:outline-none focus:ring-2 focus:ring-cyan-500";

export const RepInput: React.FC<RepInputProps> = ({ className = "", ...rest }) => (
    <input
        type="text"
        inputMode="numeric"
        className={`${baseClasses} ${className}`}
        {...rest}
    />
);
