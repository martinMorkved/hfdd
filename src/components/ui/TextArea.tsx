import React from "react";

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    error?: boolean;
    className?: string;
}

const baseClasses =
    "w-full border border-gray-600 rounded-lg px-3 py-2 bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 placeholder-gray-400 resize-none transition-colors";
const errorClasses = "border-red-500 focus:ring-red-500 focus:border-red-500";

export const TextArea: React.FC<TextAreaProps> = ({
    error = false,
    className = "",
    ...rest
}) => {
    const errorClass = error ? errorClasses : "";
    return (
        <textarea
            className={`${baseClasses} ${errorClass} ${className}`}
            {...rest}
        />
    );
};
