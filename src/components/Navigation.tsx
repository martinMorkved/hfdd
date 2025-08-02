import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export const Navigation = () => {
    const location = useLocation();
    const { user, signOut } = useAuth();

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
                                Exercise Library
                            </Link>
                            <Link
                                to="/program"
                                className={`px-3 py-2 rounded-lg text-sm font-medium transition ${location.pathname === "/program"
                                    ? "bg-cyan-600 text-white"
                                    : "text-gray-300 hover:text-white hover:bg-gray-700"
                                    }`}
                            >
                                Workout Program
                            </Link>
                        </div>
                    </div>
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