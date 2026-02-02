import React from "react";

interface StatCardProps {
    label: string;
    value: React.ReactNode;
    className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
    label,
    value,
    className = "",
}) => (
    <div
        className={`bg-gray-800 rounded-lg p-4 border border-gray-700 ${className}`}
    >
        <div className="text-cyan-400 text-sm font-medium">{label}</div>
        <div className="text-white text-2xl font-bold mt-1">{value}</div>
    </div>
);
