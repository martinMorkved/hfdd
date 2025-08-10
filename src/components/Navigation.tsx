import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useWorkoutProgram } from "../hooks/useWorkoutProgram";

export const Navigation = () => {
    const location = useLocation();
    const { user, signOut } = useAuth();
    const { activeProgram } = useWorkoutProgram();

    const handleSignOut = async () => {
        await signOut();
    };

    return (
        <nav className="bg-gray-800 border-b border-gray-700 shadow-lg">
            <div className="max-w-[1100px] mx-auto px-6 py-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-8">
                        <h1 className="text-xl font-bold text-cyan-400">HFDD</h1>
                        <div className="flex space-x-6">
                            <Link
                                to="/"
                                className={`px-3 py-2 rounded-lg text-sm font-medium transition ${location.pathname === "/"
                                    ? "bg-cyan-600 text-white"
                                    : "text-gray-300 hover:text-white hover:bg-gray-700"
                                    }`}
                            >
                                Dashboard
                            </Link>
                            <Link
                                to="/exercises"
                                className={`px-3 py-2 rounded-lg text-sm font-medium transition ${location.pathname === "/exercises"
                                    ? "bg-cyan-600 text-white"
                                    : "text-gray-300 hover:text-white hover:bg-gray-700"
                                    }`}
                            >
                                Exercise Library
                            </Link>
                            <Link
                                to="/programs"
                                className={`px-3 py-2 rounded-lg text-sm font-medium transition ${location.pathname === "/programs"
                                    ? "bg-cyan-600 text-white"
                                    : "text-gray-300 hover:text-white hover:bg-gray-700"
                                    }`}
                            >
                                Programs
                            </Link>
                            <Link
                                to="/program"
                                className={`px-3 py-2 rounded-lg text-sm font-medium transition ${location.pathname === "/program"
                                    ? "bg-cyan-600 text-white"
                                    : "text-gray-300 hover:text-white hover:bg-gray-700"
                                    }`}
                            >
                                Create Program
                            </Link>
                            <Link
                                to="/history"
                                className={`px-3 py-2 rounded-lg text-sm font-medium transition ${location.pathname === "/history"
                                    ? "bg-cyan-600 text-white"
                                    : "text-gray-300 hover:text-white hover:bg-gray-700"
                                    }`}
                            >
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
                    <div className="flex items-center space-x-4">
                        <span className="text-gray-300 text-sm">
                            {user?.email}
                        </span>
                        <button
                            onClick={handleSignOut}
                            className="px-3 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition"
                        >
                            Sign Out
                        </button>
                    </div>
                </div>
            </div>
        </nav>
    );
}; 