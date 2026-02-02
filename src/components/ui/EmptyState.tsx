import React from "react";

interface EmptyStateProps {
    title: string;
    description?: string;
    action?: React.ReactNode;
    className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
    title,
    description,
    action,
    className = "",
}) => (
    <div className={`text-center py-8 ${className}`}>
        <div className="text-gray-400 text-lg mb-2">{title}</div>
        {description && (
            <p className="text-gray-500 text-sm mb-4">{description}</p>
        )}
        {action && <div className="mt-4">{action}</div>}
    </div>
);
