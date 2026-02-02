import React from "react";

interface PageLayoutProps {
    children: React.ReactNode;
    maxWidth?: string;
    className?: string;
}

const defaultMaxWidth = "max-w-6xl";

export const PageLayout: React.FC<PageLayoutProps> = ({
    children,
    maxWidth = defaultMaxWidth,
    className = "",
}) => (
    <div className={`min-h-screen bg-gray-900 ${className}`}>
        <div className="p-4 sm:p-8">
            <div className={`mx-auto ${maxWidth}`}>
                {children}
            </div>
        </div>
    </div>
);
