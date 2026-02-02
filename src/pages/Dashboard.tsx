import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useWorkoutProgram } from "../hooks/useWorkoutProgram";
import { useAuth } from "../contexts/AuthContext";
import { Modal } from "../components/ui/Modal";
import { StatCard } from "../components/ui/StatCard";
import {
    DumbbellIcon,
    CalendarIcon,
    ChartIcon,
    ClipboardIcon,
    EditIcon
} from "../components/icons";

export default function Dashboard() {
    const { user } = useAuth();
    const { activeProgram, programs } = useWorkoutProgram();
    const [showLogModal, setShowLogModal] = useState(false);
    const navigate = useNavigate();

    const getTotalExercises = (program: any) => {
        return program.weeks.reduce((total: number, week: any) => {
            return total + week.days.reduce((dayTotal: number, day: any) => {
                return dayTotal + day.exercises.length;
            }, 0);
        }, 0);
    };

    const handleLogWorkout = () => {
        setShowLogModal(true);
    };

    const handleLogChoice = (choice: 'program' | 'freeform' | 'picker') => {
        setShowLogModal(false);

        if (choice === 'program') {
            navigate('/log-workout', { state: { sessionType: 'program' } });
        } else if (choice === 'freeform') {
            navigate('/log-workout');
        } else if (choice === 'picker') {
            navigate('/programs');
        }
    };

    return (
        <div className="min-h-screen bg-gray-900">
            <div className="p-4 sm:p-8">
                <div className="max-w-6xl mx-auto">
                    {/* Welcome Header */}
                    <div className="mb-6 sm:mb-8">
                        <h1 className="text-2xl sm:text-4xl font-bold text-white mb-1 sm:mb-2 flex items-center gap-3">
                            Welcome back, {user?.email?.split('@')[0]}!
                            <DumbbellIcon size={36} className="text-cyan-400 hidden sm:block" />
                        </h1>
                        <p className="text-gray-400 text-sm sm:text-lg">
                            Ready to crush your workout today?
                        </p>
                    </div>

                    {/* Log Workout Section - Always Available */}
                    <div className="mb-6 sm:mb-8">
                        <div className="bg-gradient-to-r from-green-900 to-emerald-900 rounded-lg border border-green-500 p-4 sm:p-6">
                            <span className="inline-block px-3 py-1 bg-green-500 text-white text-xs font-semibold rounded-full mb-3">
                                LOG WORKOUT
                            </span>
                            <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">Log Your Workout</h2>
                            <p className="text-green-200 text-sm mb-4 sm:mb-6">
                                Track your workout session and build your fitness journey!
                            </p>
                            <button
                                onClick={handleLogWorkout}
                                className="w-full sm:w-auto px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm font-medium flex items-center justify-center gap-2"
                            >
                                <ClipboardIcon size={18} />
                                Log Workout
                            </button>
                        </div>
                    </div>

                    {/* Active Program Section */}
                    {activeProgram ? (
                        <div className="mb-6 sm:mb-8">
                            <div className="bg-gradient-to-r from-cyan-900 to-blue-900 rounded-lg border border-cyan-500 p-4 sm:p-6">
                                <span className="inline-block px-3 py-1 bg-cyan-500 text-white text-xs font-semibold rounded-full mb-3">
                                    ACTIVE PROGRAM
                                </span>
                                <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">{activeProgram.name}</h2>

                                {activeProgram.description && (
                                    <p className="text-cyan-200 text-sm mb-4">{activeProgram.description}</p>
                                )}

                                <div className="grid grid-cols-2 gap-3 mb-4 sm:mb-6 text-sm text-cyan-200">
                                    <div className="flex items-center gap-2">
                                        <span className="text-cyan-400">•</span>
                                        <span>{activeProgram.weeks.length} weeks</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-cyan-400">•</span>
                                        <span>{activeProgram.weeks[0]?.days.length || 0} days/week</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-cyan-400">•</span>
                                        <span>{getTotalExercises(activeProgram)} exercises</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-cyan-400">•</span>
                                        <span className="truncate">{activeProgram.structure === 'rotating' ? 'Rotating' : activeProgram.structure}</span>
                                    </div>
                                </div>

                                <div className="flex flex-col sm:flex-row gap-3">
                                    <Link
                                        to="/program"
                                        state={{ selectedProgramId: activeProgram.id }}
                                        className="px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition text-sm font-medium flex items-center justify-center gap-2"
                                    >
                                        <EditIcon size={18} />
                                        Edit Program
                                    </Link>
                                    <Link
                                        to="/programs"
                                        className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition text-sm font-medium flex items-center justify-center gap-2"
                                    >
                                        <ClipboardIcon size={18} />
                                        Manage Programs
                                    </Link>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="mb-8">
                            <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
                                <div className="text-center">
                                    <h2 className="text-xl font-bold text-white mb-2">No Active Program</h2>
                                    <p className="text-gray-400 mb-4">
                                        You don't have an active workout program yet. Create one or activate an existing program to get started!
                                    </p>
                                    <div className="flex gap-4 justify-center">
                                        <Link
                                            to="/programs"
                                            className="px-6 py-3 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition font-semibold"
                                        >
                                            View Programs
                                        </Link>
                                        <Link
                                            to="/program"
                                            className="px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition font-semibold"
                                        >
                                            Create New Program
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Quick Actions Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                        {/* Exercise Library */}
                        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 hover:border-cyan-500 transition-colors">
                            <div className="flex items-center gap-3 mb-4">
                                <DumbbellIcon size={28} className="text-cyan-400" />
                                <h3 className="text-xl font-bold text-white">Exercise Library</h3>
                            </div>
                            <p className="text-gray-400 text-sm mb-4">
                                Browse and manage your exercise database. Add new exercises or edit existing ones.
                            </p>
                            <Link
                                to="/exercises"
                                className="inline-block px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition text-sm font-medium"
                            >
                                Browse Exercises
                            </Link>
                        </div>

                        {/* Programs */}
                        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 hover:border-cyan-500 transition-colors">
                            <div className="flex items-center gap-3 mb-4">
                                <CalendarIcon size={28} className="text-cyan-400" />
                                <h3 className="text-xl font-bold text-white">Programs</h3>
                            </div>
                            <p className="text-gray-400 text-sm mb-4">
                                Create and manage your workout programs. Build structured training plans.
                            </p>
                            <Link
                                to="/programs"
                                className="inline-block px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition text-sm font-medium"
                            >
                                Manage Programs
                            </Link>
                        </div>

                        {/* Workout History */}
                        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 hover:border-cyan-500 transition-colors">
                            <div className="flex items-center gap-3 mb-4">
                                <ChartIcon size={28} className="text-cyan-400" />
                                <h3 className="text-xl font-bold text-white">Workout History</h3>
                            </div>
                            <p className="text-gray-400 text-sm mb-4">
                                View your past workouts and track your progress over time.
                            </p>
                            <button
                                onClick={() => console.log("View workout history")}
                                className="inline-block px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition text-sm font-medium"
                            >
                                Coming Soon
                            </button>
                        </div>
                    </div>

                    {/* Recent Activity or Quick Stats */}
                    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                        <h3 className="text-xl font-bold text-white mb-4">Quick Stats</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <StatCard label="Total Programs" value={programs.length} />
                            <StatCard
                                label="Active Weeks"
                                value={activeProgram ? activeProgram.weeks.length : 0}
                            />
                            <StatCard
                                label="Total Exercises"
                                value={activeProgram ? getTotalExercises(activeProgram) : 0}
                            />
                            <StatCard label="Workouts This Week" value={0} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Log Workout Modal */}
            <Modal
                isOpen={showLogModal}
                onClose={() => setShowLogModal(false)}
                title="Log Your Workout"
                maxWidth="max-w-md"
            >
                {activeProgram ? (
                    <div>
                        <p className="text-gray-300 mb-6">
                            You have <span className="font-semibold text-cyan-400">"{activeProgram.name}"</span> as your active program.
                        </p>
                        <p className="text-gray-300 mb-6">
                            How would you like to log your workout?
                        </p>
                        <div className="space-y-3">
                            <button
                                onClick={() => handleLogChoice('program')}
                                className="w-full px-4 py-3 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition font-semibold flex items-center gap-3"
                            >
                                <ClipboardIcon size={20} />
                                Log from Program
                            </button>
                            <button
                                onClick={() => handleLogChoice('freeform')}
                                className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition font-semibold flex items-center gap-3"
                            >
                                <EditIcon size={20} />
                                Free-form Workout
                            </button>
                        </div>
                    </div>
                ) : (
                    <div>
                        <p className="text-gray-300 mb-6">
                            You don't have an active program yet.
                        </p>
                        <p className="text-gray-300 mb-6">
                            How would you like to proceed?
                        </p>
                        <div className="space-y-3">
                            <button
                                onClick={() => handleLogChoice('freeform')}
                                className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-semibold flex items-center gap-3"
                            >
                                <EditIcon size={20} />
                                Log Free-form Workout
                            </button>
                            <button
                                onClick={() => handleLogChoice('picker')}
                                className="w-full px-4 py-3 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition font-semibold flex items-center gap-3"
                            >
                                <CalendarIcon size={20} />
                                Choose a Program
                            </button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}
