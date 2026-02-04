import React from "react";

type ButtonVariant = "primary" | "secondary" | "danger" | "success" | "ghost";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ButtonVariant;
    children: React.ReactNode;
    icon?: React.ReactNode;
    fullWidth?: boolean;
    className?: string;
}

const variantClasses: Record<ButtonVariant, string> = {
    primary: "bg-cyan-600 text-white hover:bg-cyan-700 border-cyan-500",
    secondary: "bg-gray-700 text-white hover:bg-gray-600 border-gray-600",
    danger: "bg-red-600 text-white hover:bg-red-700 border-red-500",
    success: "bg-green-600 text-white hover:bg-green-700 border-green-500",
    ghost: "bg-transparent text-gray-300 hover:bg-gray-700 border-gray-600",
};

export const Button: React.FC<ButtonProps> = ({
    variant = "primary",
    children,
    icon,
    fullWidth,
    className = "",
    disabled,
    ...rest
}) => {
    const base =
        "inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg border transition text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed";
    const variantClass = variantClasses[variant];
    const widthClass = fullWidth ? "w-full" : "";
    
    // Primary buttons should show icons when provided, secondary buttons should not show icons
    const shouldShowIcon = variant === "primary" && icon !== undefined;

    return (
        <button
            type="button"
            className={`${base} ${variantClass} ${widthClass} ${className}`}
            disabled={disabled}
            {...rest}
        >
            {shouldShowIcon && icon}
            {children}
        </button>
    );
};
