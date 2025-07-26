import { Routes, Route } from "react-router-dom";
import { ExerciseLibrary } from "./components/ExerciseLibrary";
import { Navigation } from "./components/Navigation";
import WorkoutProgram from "./pages/WorkoutProgram";
import "./styles/App.css";

function App() {
  return (
    <div className="min-h-screen bg-gray-900">
      <Navigation />

      {/* Page Content */}
      <main className="pt-6">
        <Routes>
          <Route path="/" element={<ExerciseLibrary />} />
          <Route path="/program" element={<WorkoutProgram />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
