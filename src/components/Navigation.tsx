import { Link, useLocation } from "react-router-dom";

export const Navigation = () => {
    const location = useLocation();

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
                </div>
            </div>
        </nav>
    );
}; 