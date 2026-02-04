import React from "react";
import { ChevronDownIcon } from "../icons";

type SelectVariant = "default" | "edit";

interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "className"> {
    variant?: SelectVariant;
    className?: string;
    children: React.ReactNode;
}

const baseClasses =
    "w-full border rounded-lg pl-3 pr-10 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500 appearance-none transition-colors";
const variantClasses: Record<SelectVariant, string> = {
    default: "border-gray-400 bg-gray-900 text-white",
    edit: "border-gray-600 bg-gray-800 text-cyan-400 text-sm font-medium min-w-[12rem]"
};
const iconVariantClasses: Record<SelectVariant, string> = {
    default: "text-gray-400",
    edit: "text-cyan-400"
};

export const Select: React.FC<SelectProps> = ({
    variant = "default",
    className = "",
    children,
    ...rest
}) => {
    const variantClass = variantClasses[variant];
    const iconClass = iconVariantClasses[variant];
    return (
        <div className="relative w-fit">
            <select
                className={`${baseClasses} ${variantClass} ${className}`}
                {...rest}
            >
                {children}
            </select>
            <span className={`absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none ${iconClass}`}>
                <ChevronDownIcon size={18} />
            </span>
        </div>
    );
};
