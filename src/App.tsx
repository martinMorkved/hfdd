import { useState, useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import { Navigation } from "./components/ui/Navigation";
import { LoadingScreen } from "./components/ui/LoadingScreen";
import { Login, ResetPassword } from "./features/auth";
import { ExerciseLibrary } from "./features/exercises";
import WorkoutProgram from "./pages/WorkoutProgram";
import Programs from "./pages/Programs";
import Dashboard from "./pages/Dashboard";
import WorkoutLogger from "./pages/WorkoutLogger";
import WorkoutHistory from "./pages/WorkoutHistory";
import { useAuth } from "./contexts/AuthContext";
import "./styles/App.css";

function App() {
  const { user, loading } = useAuth();
  const [isRecoveryMode, setIsRecoveryMode] = useState(false);

  // Check for recovery token in URL hash
  useEffect(() => {
    const hash = window.location.hash;
    if (hash.includes('type=recovery')) {
      setIsRecoveryMode(true);
    }
  }, []);

  if (loading) {
    return <LoadingScreen message="Loading..." />;
  }

  // Show password reset form if in recovery mode (even if logged in)
  if (isRecoveryMode && user) {
    return <ResetPassword />;
  }

  if (!user) {
    return <Login />;
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <Navigation />

      {/* Page Content */}
      <main className="pt-6">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/exercises" element={<ExerciseLibrary />} />
          <Route path="/programs" element={<Programs />} />
          <Route path="/program" element={<WorkoutProgram />} />
          <Route path="/log-workout" element={<WorkoutLogger />} />
          <Route path="/history" element={<WorkoutHistory />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
