import './App.css'
import { Navigate, Route, Routes } from 'react-router-dom'
import SkyDemo from './pages/SkyDemo'

function App() {
  return (
    <div className="app-shell">
      <Routes>
        <Route path="/" element={<Navigate to="/demo/sky" replace />} />
        <Route path="/demo/sky" element={<SkyDemo />} />
        <Route path="*" element={<Navigate to="/demo/sky" replace />} />
      </Routes>
    </div>
  )
}

export default App
