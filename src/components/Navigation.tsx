import { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useWorkoutProgram } from "../hooks/useWorkoutProgram";
import { DumbbellIcon, ClipboardIcon, PlusIcon, ClockIcon, LogoutIcon, UserIcon } from "./icons";

export const Navigation = () => {
    const location = useLocation();
    const { user, signOut } = useAuth();
    const { activeProgram } = useWorkoutProgram();
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setUserMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSignOut = async () => {
        setUserMenuOpen(false);
        await signOut();
    };

    return (
        <nav className="bg-gray-800 border-b border-gray-700 shadow-lg">
            <div className="max-w-[1100px] mx-auto px-6 py-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-8">
                        <Link to="/" className="hover:opacity-80 transition">
                            <div className="flex flex-col items-center font-bold text-cyan-400">
                                <span className="text-lg leading-tight">HF</span>
                                <span className="text-lg leading-tight -mt-1">DD</span>
                            </div>
                        </Link>
                        <div className="flex space-x-4">
                            <Link
                                to="/exercises"
                                className={`px-3 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2 ${location.pathname === "/exercises"
                                    ? "bg-cyan-600 text-white"
                                    : "text-gray-300 hover:text-white hover:bg-gray-700"
                                    }`}
                            >
                                <DumbbellIcon size={16} />
                                Exercises
                            </Link>
                            <Link
                                to="/programs"
                                className={`px-3 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2 ${location.pathname === "/programs"
                                    ? "bg-cyan-600 text-white"
                                    : "text-gray-300 hover:text-white hover:bg-gray-700"
                                    }`}
                            >
                                <ClipboardIcon size={16} />
                                Programs
                            </Link>
                            <Link
                                to="/program"
                                className={`px-3 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2 ${location.pathname === "/program"
                                    ? "bg-cyan-600 text-white"
                                    : "text-gray-300 hover:text-white hover:bg-gray-700"
                                    }`}
                            >
                                <PlusIcon size={16} />
                                Create
                            </Link>
                            <Link
                                to="/history"
                                className={`px-3 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2 ${location.pathname === "/history"
                                    ? "bg-cyan-600 text-white"
                                    : "text-gray-300 hover:text-white hover:bg-gray-700"
                                    }`}
                            >
                                <ClockIcon size={16} />
                                History
                            </Link>
                        </div>
                    </div>
                    {activeProgram && (
                        <div className="flex items-center space-x-3">
                            <div className="flex items-center space-x-2 px-3 py-1 bg-green-600 text-white rounded-lg text-sm">
                                <span className="w-2 h-2 bg-white rounded-full"></span>
                                <span className="font-medium">Active:</span>
                                <span>{activeProgram.name}</span>
                            </div>
                        </div>
                    )}
                    <div className="relative" ref={menuRef}>
                        <button
                            onClick={() => setUserMenuOpen(!userMenuOpen)}
                            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-700 transition"
                        >
                            <UserIcon size={18} />
                            <span>{user?.email?.split('@')[0]}</span>
                            <svg
                                className={`w-4 h-4 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>

                        {userMenuOpen && (
                            <div className="absolute right-0 mt-2 w-48 bg-gray-800 border border-gray-700 rounded-lg shadow-lg py-1 z-50">
                                <div className="px-4 py-2 border-b border-gray-700">
                                    <div className="text-sm text-gray-400">Signed in as</div>
                                    <div className="text-sm text-white font-medium truncate">{user?.email}</div>
                                </div>
                                <button
                                    onClick={handleSignOut}
                                    className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-gray-700 transition flex items-center gap-2"
                                >
                                    <LogoutIcon size={16} />
                                    Sign Out
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
}; 