import { Routes, Route } from "react-router-dom"
import Home from "./components/pages/Home"
import Login from "./components/pages/Login"
import JoinQueue from "./components/pages/JoinQueue"
import Dashboard from "./components/pages/Dashboard"

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/join" element={<JoinQueue />} />
      <Route path="/dashboard" element={<Dashboard />} />
    </Routes>
  )
}

export default App
