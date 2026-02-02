import React from 'react';

interface IconProps {
    size?: number;
    className?: string;
    strokeWidth?: number;
}

const defaultProps: IconProps = {
    size: 24,
    strokeWidth: 1.5,
};

// Dumbbell - for exercises/workouts
export const DumbbellIcon: React.FC<IconProps> = ({
    size = defaultProps.size,
    className = '',
    strokeWidth = defaultProps.strokeWidth
}) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
    >
        <path d="M6 7v10" />
        <path d="M18 7v10" />
        <path d="M3 9v6" />
        <path d="M21 9v6" />
        <path d="M6 12h12" />
        <path d="M3 12h3" />
        <path d="M18 12h3" />
    </svg>
);

// Calendar - for scheduling/programs
export const CalendarIcon: React.FC<IconProps> = ({
    size = defaultProps.size,
    className = '',
    strokeWidth = defaultProps.strokeWidth
}) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
    >
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <path d="M16 2v4" />
        <path d="M8 2v4" />
        <path d="M3 10h18" />
    </svg>
);

// Chart - for stats/progress
export const ChartIcon: React.FC<IconProps> = ({
    size = defaultProps.size,
    className = '',
    strokeWidth = defaultProps.strokeWidth
}) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
    >
        <path d="M3 3v18h18" />
        <path d="M7 16l4-4 4 2 5-6" />
    </svg>
);

// Clipboard/List - for programs
export const ClipboardIcon: React.FC<IconProps> = ({
    size = defaultProps.size,
    className = '',
    strokeWidth = defaultProps.strokeWidth
}) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
    >
        <rect x="5" y="3" width="14" height="18" rx="2" />
        <path d="M9 7h6" />
        <path d="M9 11h6" />
        <path d="M9 15h4" />
    </svg>
);

// Clock/History - for workout history
export const ClockIcon: React.FC<IconProps> = ({
    size = defaultProps.size,
    className = '',
    strokeWidth = defaultProps.strokeWidth
}) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
    >
        <circle cx="12" cy="12" r="9" />
        <path d="M12 6v6l4 2" />
    </svg>
);

// Plus - for adding items
export const PlusIcon: React.FC<IconProps> = ({
    size = defaultProps.size,
    className = '',
    strokeWidth = defaultProps.strokeWidth
}) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
    >
        <path d="M12 5v14" />
        <path d="M5 12h14" />
    </svg>
);

// Home/Dashboard
export const HomeIcon: React.FC<IconProps> = ({
    size = defaultProps.size,
    className = '',
    strokeWidth = defaultProps.strokeWidth
}) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
    >
        <path d="M3 12l9-9 9 9" />
        <path d="M5 10v10a1 1 0 001 1h4v-6h4v6h4a1 1 0 001-1V10" />
    </svg>
);

// Running figure - dynamic workout icon
export const RunnerIcon: React.FC<IconProps> = ({
    size = defaultProps.size,
    className = '',
    strokeWidth = defaultProps.strokeWidth
}) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
    >
        <circle cx="14" cy="4" r="2" />
        <path d="M6 20l3-7" />
        <path d="M9 13l4-2 3 4" />
        <path d="M13 11l-2-4 4-1" />
        <path d="M16 17l2 3" />
    </svg>
);

// Trophy - for achievements/library
export const TrophyIcon: React.FC<IconProps> = ({
    size = defaultProps.size,
    className = '',
    strokeWidth = defaultProps.strokeWidth
}) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
    >
        <path d="M6 4h12v6a6 6 0 01-12 0V4z" />
        <path d="M6 8H4a2 2 0 00-2 2v1a3 3 0 003 3" />
        <path d="M18 8h2a2 2 0 012 2v1a3 3 0 01-3 3" />
        <path d="M12 16v4" />
        <path d="M8 20h8" />
    </svg>
);

// Settings/Gear
export const SettingsIcon: React.FC<IconProps> = ({
    size = defaultProps.size,
    className = '',
    strokeWidth = defaultProps.strokeWidth
}) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
    >
        <circle cx="12" cy="12" r="3" />
        <path d="M12 2v2" />
        <path d="M12 20v2" />
        <path d="M4.93 4.93l1.41 1.41" />
        <path d="M17.66 17.66l1.41 1.41" />
        <path d="M2 12h2" />
        <path d="M20 12h2" />
        <path d="M4.93 19.07l1.41-1.41" />
        <path d="M17.66 6.34l1.41-1.41" />
    </svg>
);

// User/Profile
export const UserIcon: React.FC<IconProps> = ({
    size = defaultProps.size,
    className = '',
    strokeWidth = defaultProps.strokeWidth
}) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
    >
        <circle cx="12" cy="8" r="4" />
        <path d="M4 20c0-4 4-6 8-6s8 2 8 6" />
    </svg>
);

// Logout/Sign out
export const LogoutIcon: React.FC<IconProps> = ({
    size = defaultProps.size,
    className = '',
    strokeWidth = defaultProps.strokeWidth
}) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
    >
        <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
        <path d="M16 17l5-5-5-5" />
        <path d="M21 12H9" />
    </svg>
);

// Check/Complete
export const CheckIcon: React.FC<IconProps> = ({
    size = defaultProps.size,
    className = '',
    strokeWidth = defaultProps.strokeWidth
}) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
    >
        <path d="M5 12l5 5L20 7" />
    </svg>
);

// X/Close
export const XIcon: React.FC<IconProps> = ({
    size = defaultProps.size,
    className = '',
    strokeWidth = defaultProps.strokeWidth
}) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
    >
        <path d="M18 6L6 18" />
        <path d="M6 6l12 12" />
    </svg>
);

// Info (circle with i) - for description / more info
export const InfoIcon: React.FC<IconProps> = ({
    size = defaultProps.size,
    className = '',
    strokeWidth = defaultProps.strokeWidth
}) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
    >
        <circle cx="12" cy="12" r="10" />
        <path d="M12 16v-4" />
        <path d="M12 8h.01" />
    </svg>
);

// Edit/Pencil
export const EditIcon: React.FC<IconProps> = ({
    size = defaultProps.size,
    className = '',
    strokeWidth = defaultProps.strokeWidth
}) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
    >
        <path d="M17 3l4 4L7 21H3v-4L17 3z" />
    </svg>
);

// Trash/Delete
export const TrashIcon: React.FC<IconProps> = ({
    size = defaultProps.size,
    className = '',
    strokeWidth = defaultProps.strokeWidth
}) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
    >
        <path d="M3 6h18" />
        <path d="M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2" />
        <path d="M5 6v14a2 2 0 002 2h10a2 2 0 002-2V6" />
        <path d="M10 11v6" />
        <path d="M14 11v6" />
    </svg>
);

// Chevron Up / Chevron Down (reorder)
export const ChevronUpIcon: React.FC<IconProps> = ({
    size = defaultProps.size,
    className = '',
    strokeWidth = defaultProps.strokeWidth
}) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M18 15l-6-6-6 6" />
    </svg>
);
export const ChevronDownIcon: React.FC<IconProps> = ({
    size = defaultProps.size,
    className = '',
    strokeWidth = defaultProps.strokeWidth
}) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M6 9l6 6 6-6" />
    </svg>
);

// Arrow Right
export const ArrowRightIcon: React.FC<IconProps> = ({
    size = defaultProps.size,
    className = '',
    strokeWidth = defaultProps.strokeWidth
}) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
    >
        <path d="M5 12h14" />
        <path d="M12 5l7 7-7 7" />
    </svg>
);

// Menu/Hamburger
export const MenuIcon: React.FC<IconProps> = ({
    size = defaultProps.size,
    className = '',
    strokeWidth = defaultProps.strokeWidth
}) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
    >
        <path d="M4 6h16" />
        <path d="M4 12h16" />
        <path d="M4 18h16" />
    </svg>
);

// Search
export const SearchIcon: React.FC<IconProps> = ({
    size = defaultProps.size,
    className = '',
    strokeWidth = defaultProps.strokeWidth
}) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
    >
        <circle cx="11" cy="11" r="7" />
        <path d="M21 21l-4.35-4.35" />
    </svg>
);

// HFDD Logo - stacked HF over DD with connected lines
export const HFDDLogo: React.FC<IconProps> = ({
    size = 32,
    className = ''
}) => (
    <svg
        width={size}
        height={size * 1.1}
        viewBox="0 0 36 40"
        fill="none"
        stroke="currentColor"
        strokeWidth={2.5}
        strokeLinecap="square"
        strokeLinejoin="miter"
        className={className}
    >
        {/* H - left vertical (full height, shared with D1) */}
        <path d="M2 1v38" />
        {/* H - right vertical (top half only) */}
        <path d="M10 1v18" />
        {/* H - horizontal bar */}
        <path d="M2 10h8" />

        {/* F - left vertical (connects to H area) */}
        <path d="M16 1v18" />
        {/* F - top horizontal */}
        <path d="M16 1h12" />
        {/* F - middle horizontal */}
        <path d="M16 10h10" />

        {/* Connecting line between H and F at top */}
        <path d="M10 1h6" />

        {/* D1 - left D (shares left stroke with H) */}
        <path d="M2 21h6" />
        <path d="M2 39h6" />
        <path d="M8 21c6 0 9 4 9 9s-3 9-9 9" />

        {/* D2 - right D */}
        <path d="M20 21v18" />
        <path d="M20 21h6" />
        <path d="M20 39h6" />
        <path d="M26 21c6 0 9 4 9 9s-3 9-9 9" />
    </svg>
);
