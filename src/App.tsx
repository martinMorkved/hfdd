import { Routes, Route } from "react-router-dom";
import { ExerciseLibrary } from "./components/ExerciseLibrary";
import { Navigation } from "./components/Navigation";
import { Login } from "./components/Auth/Login";
import WorkoutProgram from "./pages/WorkoutProgram";
import Programs from "./pages/Programs";
import Dashboard from "./pages/Dashboard";
import { useAuth } from "./contexts/AuthContext";
import "./styles/App.css";

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-cyan-400 text-xl">Loading...</div>
      </div>
    );
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
        </Routes>
      </main>
    </div>
  );
}

export default App;
