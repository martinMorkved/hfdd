import React from "react";
import { CheckIcon } from "../icons";

interface CheckboxProps {
    checked: boolean;
    onChange: () => void;
    ariaLabel: string;
    disabled?: boolean;
    className?: string;
    /** Optional: pass-through for the hidden native input (e.g. name, id) */
    inputProps?: Omit<React.InputHTMLAttributes<HTMLInputElement>, "type" | "checked" | "onChange" | "className" | "aria-label">;
}

const baseBox =
    "w-5 h-5 rounded-lg border flex items-center justify-center shrink-0 pointer-events-none transition-colors";
const uncheckedBox = "border-gray-600 bg-gray-800";
const checkedBox = "border-cyan-500 bg-gray-800";

export const Checkbox: React.FC<CheckboxProps> = ({
    checked,
    onChange,
    ariaLabel,
    disabled = false,
    className = "",
    inputProps = {}
}) => (
    <>
        <input
            type="checkbox"
            checked={checked}
            onChange={onChange}
            className="sr-only"
            aria-label={ariaLabel}
            disabled={disabled}
            {...inputProps}
        />
        <div
            className={`${baseBox} ${checked ? checkedBox : uncheckedBox} ${className}`}
            aria-hidden
        >
            {checked && (
                <CheckIcon size={14} className="text-cyan-500" strokeWidth={2.5} />
            )}
        </div>
    </>
);
