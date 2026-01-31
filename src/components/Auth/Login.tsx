import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';

type AuthMode = 'signIn' | 'signUp' | 'forgotPassword' | 'resetPassword';

export const Login: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [mode, setMode] = useState<AuthMode>('signIn');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);

    const { signIn, signUp, resetPassword, updatePassword } = useAuth();

    // Check for recovery token in URL on mount
    useEffect(() => {
        const hash = window.location.hash;
        if (hash.includes('type=recovery')) {
            setMode('resetPassword');
        }
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setMessage(null);

        try {
            if (mode === 'signUp') {
                const { error } = await signUp(email, password);
                if (error) {
                    setError(error.message);
                } else {
                    setMessage('Check your email for the confirmation link!');
                }
            } else if (mode === 'signIn') {
                const { error } = await signIn(email, password);
                if (error) {
                    setError(error.message);
                }
            } else if (mode === 'forgotPassword') {
                const { error } = await resetPassword(email);
                if (error) {
                    setError(error.message);
                } else {
                    setMessage('Check your email for the password reset link!');
                }
            } else if (mode === 'resetPassword') {
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
                const { error } = await updatePassword(password);
                if (error) {
                    setError(error.message);
                } else {
                    setMessage('Password updated successfully! You can now sign in.');
                    // Clear the hash from URL
                    window.history.replaceState(null, '', window.location.pathname);
                    setMode('signIn');
                    setPassword('');
                    setConfirmPassword('');
                }
            }
        } catch (err) {
            setError('An unexpected error occurred');
        } finally {
            setLoading(false);
        }
    };

    const getTitle = () => {
        switch (mode) {
            case 'signUp': return 'Sign Up';
            case 'forgotPassword': return 'Reset Password';
            case 'resetPassword': return 'Set New Password';
            default: return 'Sign In';
        }
    };

    const getButtonText = () => {
        if (loading) return 'Loading...';
        switch (mode) {
            case 'signUp': return 'Sign Up';
            case 'forgotPassword': return 'Send Reset Link';
            case 'resetPassword': return 'Update Password';
            default: return 'Sign In';
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-900">
            <div className="w-full max-w-md p-8 bg-gray-800 rounded-xl shadow-lg">
                <h2 className="text-3xl font-bold text-white text-center mb-8">
                    {getTitle()}
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
                    {/* Email field - shown for signIn, signUp, forgotPassword */}
                    {mode !== 'resetPassword' && (
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                                Email
                            </label>
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="w-full border border-gray-600 rounded-lg px-4 py-2 bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 placeholder-gray-400"
                                placeholder="Enter your email"
                            />
                        </div>
                    )}

                    {/* Password field - shown for signIn, signUp, resetPassword */}
                    {mode !== 'forgotPassword' && (
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                                {mode === 'resetPassword' ? 'New Password' : 'Password'}
                            </label>
                            <input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="w-full border border-gray-600 rounded-lg px-4 py-2 bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 placeholder-gray-400"
                                placeholder={mode === 'resetPassword' ? 'Enter new password' : 'Enter your password'}
                            />
                        </div>
                    )}

                    {/* Confirm Password field - only for resetPassword */}
                    {mode === 'resetPassword' && (
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
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full px-6 py-3 bg-cyan-600 text-white rounded-lg border border-cyan-500 hover:bg-cyan-700 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {getButtonText()}
                    </button>
                </form>

                {/* Navigation links */}
                <div className="mt-6 text-center space-y-2">
                    {mode === 'signIn' && (
                        <>
                            <button
                                onClick={() => { setMode('forgotPassword'); setError(null); setMessage(null); }}
                                className="text-gray-400 hover:text-gray-300 text-sm block w-full"
                            >
                                Forgot your password?
                            </button>
                            <button
                                onClick={() => { setMode('signUp'); setError(null); setMessage(null); }}
                                className="text-cyan-400 hover:text-cyan-300 text-sm"
                            >
                                Don't have an account? Sign Up
                            </button>
                        </>
                    )}
                    {mode === 'signUp' && (
                        <button
                            onClick={() => { setMode('signIn'); setError(null); setMessage(null); }}
                            className="text-cyan-400 hover:text-cyan-300 text-sm"
                        >
                            Already have an account? Sign In
                        </button>
                    )}
                    {(mode === 'forgotPassword' || mode === 'resetPassword') && (
                        <button
                            onClick={() => { setMode('signIn'); setError(null); setMessage(null); }}
                            className="text-cyan-400 hover:text-cyan-300 text-sm"
                        >
                            Back to Sign In
                        </button>
                    )}
                </div>

                {mode === 'signUp' && (
                    <div className="mt-4 p-3 bg-blue-900/20 border border-blue-500 rounded-lg">
                        <p className="text-blue-400 text-xs">
                            After signing up, check your email for a confirmation link to activate your account.
                        </p>
                    </div>
                )}

                {mode === 'forgotPassword' && (
                    <div className="mt-4 p-3 bg-blue-900/20 border border-blue-500 rounded-lg">
                        <p className="text-blue-400 text-xs">
                            Enter your email and we'll send you a link to reset your password.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}; 