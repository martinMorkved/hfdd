import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './styles/App.css'
import { ExerciseLibrary } from './components/ExerciseLibrary';

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <ExerciseLibrary />
    </>
  )
}

export default App
