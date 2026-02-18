import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { Button } from "./Button";

interface DateInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type" | "className" | "value" | "onChange"> {
    className?: string;
    label?: string;
    value?: string;
    onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const inputClasses =
    "w-full border border-gray-600 bg-gray-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-colors cursor-pointer";

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

function formatDisplayDate(value: string): string {
    if (!value) return "";
    const d = new Date(value + "T12:00:00");
    if (isNaN(d.getTime())) return value;
    return d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

function getDaysInMonth(year: number, month: number): Date[] {
    const first = new Date(year, month, 1);
    const last = new Date(year, month + 1, 0);
    const startPad = first.getDay();
    const days: Date[] = [];
    const start = new Date(first);
    start.setDate(start.getDate() - startPad);
    for (let i = 0; i < startPad + last.getDate(); i++) {
        days.push(new Date(start));
        start.setDate(start.getDate() + 1);
    }
    return days;
}

function toYYYYMMDD(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
}

export const DateInput: React.FC<DateInputProps> = ({
    className = "",
    label,
    id,
    value = "",
    onChange,
    ...rest
}) => {
    const [open, setOpen] = useState(false);
    const [viewDate, setViewDate] = useState(() => {
        if (value) {
            const d = new Date(value + "T12:00:00");
            return isNaN(d.getTime()) ? new Date() : d;
        }
        return new Date();
    });
    const containerRef = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const [position, setPosition] = useState({ top: 0, left: 0 });

    useEffect(() => {
        if (value) {
            const d = new Date(value + "T12:00:00");
            if (!isNaN(d.getTime())) setViewDate(d);
        } else {
            setViewDate(new Date());
        }
    }, [value]);

    const inputId = id ?? (label ? `date-${label.replace(/\s/g, "-").toLowerCase()}` : undefined);

    useEffect(() => {
        if (!open) return;
        const el = triggerRef.current;
        if (el) {
            const rect = el.getBoundingClientRect();
            const dropdownWidth = 280;
            const dropdownHeight = 300;
            const spaceBelow = window.innerHeight - rect.bottom;
            const openAbove = spaceBelow < dropdownHeight && rect.top > dropdownHeight;
            let left = rect.left;
            if (left + dropdownWidth > window.innerWidth - 8) left = window.innerWidth - dropdownWidth - 8;
            if (left < 8) left = 8;
            let top = openAbove ? rect.top - dropdownHeight - 4 : rect.bottom + 4;
            if (top < 8) top = 8;
            if (top + dropdownHeight > window.innerHeight - 8) top = window.innerHeight - dropdownHeight - 8;
            setPosition({ left, top });
        }
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [open]);

    const handleSelect = (d: Date) => {
        const str = toYYYYMMDD(d);
        onChange?.({ target: { value: str } } as React.ChangeEvent<HTMLInputElement>);
        setOpen(false);
    };

    const handleClear = () => {
        onChange?.({ target: { value: "" } } as React.ChangeEvent<HTMLInputElement>);
        setOpen(false);
    };

    const handleToday = () => {
        const today = new Date();
        setViewDate(today);
        handleSelect(today);
    };

    const prevMonth = () => {
        setViewDate((d) => new Date(d.getFullYear(), d.getMonth() - 1));
    };
    const nextMonth = () => {
        setViewDate((d) => new Date(d.getFullYear(), d.getMonth() + 1));
    };

    const days = getDaysInMonth(viewDate.getFullYear(), viewDate.getMonth());
    const currentMonth = viewDate.getMonth();
    const selectedDate = value ? new Date(value + "T12:00:00") : null;
    const today = toYYYYMMDD(new Date());

    return (
        <div ref={containerRef} className={label ? "flex flex-col gap-2" : ""}>
            {label && (
                <label htmlFor={inputId} className="text-gray-300 text-sm font-medium">
                    {label}
                </label>
            )}
            <div className="relative">
                <button
                    ref={triggerRef}
                    type="button"
                    id={inputId}
                    onClick={() => setOpen((o) => !o)}
                    className={`${inputClasses} ${className} text-left flex items-center justify-between`}
                    aria-haspopup="dialog"
                    aria-expanded={open}
                >
                    <span className={value ? "text-white" : "text-gray-400"}>
                        {value ? formatDisplayDate(value) : "Select date"}
                    </span>
                    <svg className="w-5 h-5 text-gray-400 shrink-0 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                </button>
                <input type="hidden" value={value} readOnly aria-hidden {...rest} />
                {open &&
                    createPortal(
                        <div
                            className="fixed z-[9999] w-[280px] bg-gray-800 border border-gray-600 rounded-lg shadow-xl p-3"
                            role="dialog"
                            aria-label="Choose date"
                            style={{ top: position.top, left: position.left }}
                        >
                            <div className="flex items-center justify-between mb-2">
                                <button
                                    type="button"
                                    onClick={prevMonth}
                                    className="p-1.5 text-gray-300 hover:text-white hover:bg-gray-700 rounded-lg transition"
                                    aria-label="Previous month"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                                </button>
                                <span className="text-white text-sm font-medium">
                                    {viewDate.toLocaleDateString(undefined, { month: "long", year: "numeric" })}
                                </span>
                                <button
                                    type="button"
                                    onClick={nextMonth}
                                    className="p-1.5 text-gray-300 hover:text-white hover:bg-gray-700 rounded-lg transition"
                                    aria-label="Next month"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                                </button>
                            </div>
                            <div className="grid grid-cols-7 gap-0.5 mb-2">
                                {WEEKDAYS.map((w) => (
                                    <div key={w} className="text-center text-gray-400 text-[10px] font-medium py-0.5">
                                        {w}
                                    </div>
                                ))}
                                {days.map((d, i) => {
                                    const isCurrentMonth = d.getMonth() === currentMonth;
                                    const str = toYYYYMMDD(d);
                                    const isSelected = selectedDate && str === value;
                                    const isTodayDate = str === today;
                                    return (
                                        <button
                                            key={i}
                                            type="button"
                                            onClick={() => isCurrentMonth && handleSelect(d)}
                                            className={`
                                                py-1.5 rounded text-xs transition
                                                ${!isCurrentMonth ? "text-gray-500 cursor-default" : "text-white hover:bg-gray-700"}
                                                ${isSelected ? "bg-cyan-600 hover:bg-cyan-700 text-white" : ""}
                                                ${isTodayDate && !isSelected ? "ring-1 ring-cyan-500" : ""}
                                            `}
                                        >
                                            {d.getDate()}
                                        </button>
                                    );
                                })}
                            </div>
                            <div className="flex gap-2 pt-2 border-t border-gray-600">
                                <Button variant="secondary" onClick={handleClear} className="flex-1 py-1.5 text-sm">
                                    Clear
                                </Button>
                                <Button variant="secondary" onClick={handleToday} className="flex-1 py-1.5 text-sm">
                                    Today
                                </Button>
                            </div>
                        </div>,
                        document.body
                    )}
            </div>
        </div>
    );
};
