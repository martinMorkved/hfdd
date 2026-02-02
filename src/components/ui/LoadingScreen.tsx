import React from "react";

interface LoadingScreenProps {
    message?: string;
    className?: string;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({
    message = "Loading...",
    className = "",
}) => (
    <div
        className={`min-h-screen bg-gray-900 flex items-center justify-center ${className}`}
        role="status"
        aria-live="polite"
    >
        <div className="text-cyan-400 text-xl">{message}</div>
    </div>
);
