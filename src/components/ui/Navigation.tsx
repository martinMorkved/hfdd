import { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { DumbbellIcon, ClipboardIcon, PlusIcon, ClockIcon, LogoutIcon, UserIcon } from "../icons";

export const Navigation = () => {
    const location = useLocation();
    const { user, signOut } = useAuth();
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const mobileMenuRef = useRef<HTMLDivElement>(null);

    // Close menus when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setUserMenuOpen(false);
            }
            if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
                setMobileMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Close mobile menu on route change
    useEffect(() => {
        setMobileMenuOpen(false);
    }, [location.pathname]);

    const handleSignOut = async () => {
        setUserMenuOpen(false);
        setMobileMenuOpen(false);
        await signOut();
    };

    const navLinks = [
        { to: "/exercises", icon: <DumbbellIcon size={16} />, label: "Exercises" },
        { to: "/programs", icon: <ClipboardIcon size={16} />, label: "Programs" },
        { to: "/program", icon: <PlusIcon size={16} />, label: "Create" },
        { to: "/history", icon: <ClockIcon size={16} />, label: "History" },
    ];

    return (
        <nav className="bg-gray-800 border-b border-gray-700 shadow-lg relative">
            <div className="max-w-[1100px] mx-auto px-4 nav:px-6 py-3 nav:py-4">
                <div className="flex items-center justify-between">
                    {/* Logo */}
                    <Link to="/" className="hover:opacity-80 transition">
                        <div className="flex flex-col items-center font-bold text-cyan-400">
                            <span className="text-lg leading-tight">HF</span>
                            <span className="text-lg leading-tight -mt-1">DD</span>
                        </div>
                    </Link>

                    {/* Desktop Navigation */}
                    <div className="hidden nav:flex items-center space-x-8">
                        <div className="flex space-x-4">
                            {navLinks.map((link) => (
                                <Link
                                    key={link.to}
                                    to={link.to}
                                    className={`px-3 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2 ${location.pathname === link.to
                                        ? "bg-cyan-600 text-white"
                                        : "text-gray-300 hover:text-white hover:bg-gray-700"
                                        }`}
                                >
                                    {link.icon}
                                    {link.label}
                                </Link>
                            ))}
                        </div>
                    </div>


                    {/* Desktop User Menu */}
                    <div className="hidden nav:block relative" ref={menuRef}>
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

                    {/* Mobile Menu Button */}
                    <div className="nav:hidden flex items-center gap-3" ref={mobileMenuRef}>
                        <button
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="p-2 rounded-lg text-gray-300 hover:text-white hover:bg-gray-700 transition"
                            aria-label="Toggle menu"
                        >
                            {mobileMenuOpen ? (
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            ) : (
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                </svg>
                            )}
                        </button>

                        {/* Mobile Fullscreen Menu */}
                        {mobileMenuOpen && (
                            <div className="fixed inset-0 top-[57px] bg-gray-900 z-50 overflow-y-auto">
                                <div className="px-6 py-6 space-y-2">
                                    {navLinks.map((link) => (
                                        <Link
                                            key={link.to}
                                            to={link.to}
                                            className={`flex items-center gap-4 px-4 py-4 rounded-xl text-lg font-medium transition ${location.pathname === link.to
                                                ? "bg-cyan-600 text-white"
                                                : "text-gray-300 hover:text-white hover:bg-gray-800"
                                                }`}
                                        >
                                            {link.icon}
                                            {link.label}
                                        </Link>
                                    ))}

                                    {/* User section in mobile menu */}
                                    <div className="border-t border-gray-700 mt-6 pt-6">
                                        <div className="px-4 py-3">
                                            <div className="text-sm text-gray-400">Signed in as</div>
                                            <div className="text-base text-white font-medium truncate">{user?.email}</div>
                                        </div>
                                        <button
                                            onClick={handleSignOut}
                                            className="w-full flex items-center gap-4 px-4 py-4 rounded-xl text-lg font-medium text-red-400 hover:bg-gray-800 transition"
                                        >
                                            <LogoutIcon size={20} />
                                            Sign Out
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
};
