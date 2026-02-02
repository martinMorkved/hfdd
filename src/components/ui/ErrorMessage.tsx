import React from "react";

interface ErrorMessageProps {
    message: string;
    className?: string;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({
    message,
    className = "",
}) => (
    <div
        className={`p-4 bg-red-900/20 border border-red-500 rounded-lg ${className}`}
        role="alert"
    >
        <p className="text-red-400 text-sm">{message}</p>
    </div>
);
