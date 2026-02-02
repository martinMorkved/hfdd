import React from "react";

interface PageHeaderProps {
    title: string;
    subtitle?: React.ReactNode;
    actions?: React.ReactNode;
    className?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
    title,
    subtitle,
    actions,
    className = "",
}) => (
    <div className={`mb-8 ${className}`}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1 sm:mb-2">
                    {title}
                </h1>
                {subtitle && (
                    <p className="text-gray-400 text-sm sm:text-base">{subtitle}</p>
                )}
            </div>
            {actions && <div className="flex-shrink-0">{actions}</div>}
        </div>
    </div>
);
