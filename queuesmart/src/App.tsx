import { Routes, Route } from "react-router-dom"
import Home from "./components/pages/Home"
import Login from "./components/pages/Login"
import JoinQueue from "./components/pages/JoinQueue"
import Dashboard from "./components/pages/Dashboard"
import AdminDashboard from "./components/pages/admin/AdminDashboard"
import QueueManagement from "./components/pages/admin/QueueManagement"


function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/join" element={<JoinQueue />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/admin" element={<AdminDashboard />} />
      <Route path="/admin/queue" element={<QueueManagement />} />
    </Routes>
  )
}

export default App
