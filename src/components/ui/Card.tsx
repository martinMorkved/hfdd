import React from "react";

interface CardProps {
    children: React.ReactNode;
    className?: string;
    title?: string;
    titleIcon?: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({
    children,
    className = "",
    title,
    titleIcon
}) => {
    return (
        <div className={`bg-gray-800 rounded-lg border border-gray-700 p-4 sm:p-6 ${className}`}>
            {title && (
                <div className="flex items-center gap-3 mb-4">
                    {titleIcon && (
                        <span className="text-cyan-400 shrink-0">
                            {titleIcon}
                        </span>
                    )}
                    <h3 className="text-xl font-bold text-white">{title}</h3>
                </div>
            )}
            <div>{children}</div>
        </div>
    );
};
