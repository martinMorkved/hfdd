import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useWorkoutProgram } from "../features/programs/useWorkoutProgram";
import { useAuth } from "../contexts/AuthContext";
import { Modal } from "../components/ui/Modal";
import { StatCard } from "../components/ui/StatCard";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { PageLayout } from "../components/ui/PageLayout";
import { getTotalExercises } from "../features/programs/utils";
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

    // Get display name from user metadata, fallback to email username
    const displayName = user?.user_metadata?.display_name ||
        user?.user_metadata?.name ||
        user?.user_metadata?.full_name ||
        user?.email?.split('@')[0] ||
        'there';

    return (
        <PageLayout>
            {/* Welcome Header */}
            <div className="mb-6 sm:mb-8">
                <h1 className="text-2xl sm:text-4xl font-bold text-white mb-1 sm:mb-2 flex items-center gap-3">
                    Welcome back, {displayName}!
                    <DumbbellIcon size={36} className="text-cyan-400 hidden sm:block" />
                </h1>
                <p className="text-gray-400 text-sm sm:text-lg">
                    Ready to crush your workout today?
                </p>
            </div>

            {/* Unified Workout & Program Section */}
            <div className="mb-6 sm:mb-8">
                <Card title="Log Your Workout" titleIcon={<ClipboardIcon size={28} />}>
                    <p className="text-gray-400 text-sm mb-4 sm:mb-6">
                        Track your workout session and build your fitness journey!
                    </p>
                    <Button
                        onClick={handleLogWorkout}
                        variant="success"
                        className="w-full sm:w-auto"
                    >
                        Log Workout
                    </Button>

                    {/* Divider */}
                    <div className="border-t border-gray-700 my-6"></div>

                    {/* Program Status Section - Bottom */}
                    {activeProgram ? (
                        <div>
                            <div className="flex items-center gap-2 mb-3">
                                <span className="text-gray-400 text-sm font-semibold">Active Program:</span>
                                <span className="text-white font-bold">{activeProgram.name}</span>
                            </div>
                            {activeProgram.description && (
                                <p className="text-gray-400 text-sm mb-4">{activeProgram.description}</p>
                            )}
                            <div className="flex flex-col sm:flex-row gap-3">
                                <Link
                                    to="/program"
                                    state={{ selectedProgramId: activeProgram.id }}
                                    className="inline-block"
                                >
                                    <Button variant="primary">
                                        Continue Program
                                    </Button>
                                </Link>
                                <Link
                                    to="/programs"
                                    className="inline-block"
                                >
                                    <Button variant="secondary">
                                        Manage Programs
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    ) : (
                        <div>
                            <p className="text-gray-400 text-sm mb-4">
                                You don't have an active workout program yet. Create one or activate an existing program to get started!
                            </p>
                            <div className="flex flex-col sm:flex-row gap-3">
                                <Link
                                    to="/programs"
                                    className="inline-block"
                                >
                                    <Button variant="primary">
                                        View Programs
                                    </Button>
                                </Link>
                                <Link
                                    to="/program"
                                    className="inline-block"
                                >
                                    <Button variant="secondary">
                                        Create New Program
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    )}
                </Card>
            </div>

            {/* Quick Actions Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {/* Exercise Library */}
                <Card
                    title="Exercise Library"
                    titleIcon={<DumbbellIcon size={28} />}
                    className="hover:border-cyan-500 transition-colors"
                >
                    <p className="text-gray-400 text-sm mb-4">
                        Browse and manage your exercise database. Add new exercises or edit existing ones.
                    </p>
                    <Link to="/exercises" className="inline-block">
                        <Button variant="primary">
                            Browse Exercises
                        </Button>
                    </Link>
                </Card>

                {/* Programs */}
                <Card
                    title="Programs"
                    titleIcon={<CalendarIcon size={28} />}
                    className="hover:border-cyan-500 transition-colors"
                >
                    <p className="text-gray-400 text-sm mb-4">
                        Create and manage your workout programs. Build structured training plans.
                    </p>
                    <Link to="/programs" className="inline-block">
                        <Button variant="primary">
                            Manage Programs
                        </Button>
                    </Link>
                </Card>

                {/* Workout History */}
                <Card
                    title="Workout History"
                    titleIcon={<ChartIcon size={28} />}
                    className="hover:border-cyan-500 transition-colors"
                >
                    <p className="text-gray-400 text-sm mb-4">
                        View your past workouts and track your progress over time.
                    </p>
                    <Link to="/history" className="inline-block">
                        <Button variant="primary">
                            View History
                        </Button>
                    </Link>
                </Card>
            </div>

            {/* Recent Activity or Quick Stats */}
            <Card title="Quick Stats">
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
            </Card>

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
                            <Button
                                onClick={() => handleLogChoice('program')}
                                variant="primary"
                                icon={<ClipboardIcon size={20} />}
                                fullWidth
                            >
                                Log from Program
                            </Button>
                            <Button
                                onClick={() => handleLogChoice('freeform')}
                                variant="secondary"
                                fullWidth
                            >
                                Free-form Workout
                            </Button>
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
                            <Button
                                onClick={() => handleLogChoice('freeform')}
                                variant="success"
                                icon={<EditIcon size={20} />}
                                fullWidth
                            >
                                Log Free-form Workout
                            </Button>
                            <Button
                                onClick={() => handleLogChoice('picker')}
                                variant="primary"
                                icon={<CalendarIcon size={20} />}
                                fullWidth
                            >
                                Choose a Program
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>
        </PageLayout>
    );
}
