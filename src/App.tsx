import { Routes, Route, Link } from "react-router-dom";
import { ExerciseLibrary } from "./components/ExerciseLibrary";
import WorkoutProgram from "./pages/WorkoutProgram";

function App() {
  return (
    <>
      <nav>
        <Link to="/">Exercise Library</Link>
        <Link to="/program">Workout Program</Link>
      </nav>
      <Routes>
        <Route path="/" element={<ExerciseLibrary />} />
        <Route path="/program" element={<WorkoutProgram />} />
      </Routes>
    </>
  );
}

export default App;
