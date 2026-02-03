import React from "react";

type TextInputVariant = "default" | "search" | "auth";

interface TextInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "className"> {
    variant?: TextInputVariant;
    error?: boolean;
    className?: string;
}

const baseClasses =
    "w-full border rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 placeholder-gray-400 transition-colors";
const variantClasses: Record<TextInputVariant, string> = {
    default: "border-gray-600 bg-gray-800 focus:ring-cyan-500 focus:border-cyan-500",
    search: "border-gray-600 bg-gray-900 focus:ring-cyan-500 focus:border-cyan-500",
    auth: "border-gray-600 bg-gray-700 focus:ring-cyan-500 focus:border-cyan-500"
};
const errorClasses = "border-red-500 focus:ring-red-500 focus:border-red-500";

export const TextInput: React.FC<TextInputProps> = ({
    variant = "default",
    error = false,
    className = "",
    ...rest
}) => {
    const variantClass = variantClasses[variant];
    const errorClass = error ? errorClasses : "";
    return (
        <input
            type="text"
            className={`${baseClasses} ${variantClass} ${errorClass} ${className}`}
            {...rest}
        />
    );
};
