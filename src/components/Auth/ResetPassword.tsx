import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';

interface ResetPasswordProps {
    onComplete: () => void;
}

export const ResetPassword: React.FC<ResetPasswordProps> = ({ onComplete }) => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);

    const { updatePassword } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setMessage(null);

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            setLoading(false);
            return;
        }

        if (password.length < 6) {
            setError('Password must be at least 6 characters');
            setLoading(false);
            return;
        }

        try {
            const { error } = await updatePassword(password);
            if (error) {
                setError(error.message);
            } else {
                setMessage('Password updated successfully! Redirecting...');
                // Wait a moment then redirect to main domain
                setTimeout(() => {
                    window.location.href = 'https://www.hfdd.no/';
                }, 1500);
            }
        } catch (err) {
            setError('An unexpected error occurred');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-900">
            <div className="w-full max-w-md p-8 bg-gray-800 rounded-xl shadow-lg">
                <h2 className="text-3xl font-bold text-white text-center mb-8">
                    Set New Password
                </h2>

                {error && (
                    <div className="mb-6 p-4 bg-red-900/20 border border-red-500 rounded-lg">
                        <p className="text-red-400 text-sm">{error}</p>
                    </div>
                )}

                {message && (
                    <div className="mb-6 p-4 bg-green-900/20 border border-green-500 rounded-lg">
                        <p className="text-green-400 text-sm">{message}</p>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                            New Password
                        </label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="w-full border border-gray-600 rounded-lg px-4 py-2 bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 placeholder-gray-400"
                            placeholder="Enter new password"
                        />
                    </div>

                    <div>
                        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-2">
                            Confirm New Password
                        </label>
                        <input
                            id="confirmPassword"
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            className="w-full border border-gray-600 rounded-lg px-4 py-2 bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 placeholder-gray-400"
                            placeholder="Confirm new password"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full px-6 py-3 bg-cyan-600 text-white rounded-lg border border-cyan-500 hover:bg-cyan-700 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Updating...' : 'Update Password'}
                    </button>
                </form>
            </div>
        </div>
    );
};
