import { Routes, Route } from "react-router-dom"
import Home from "./components/pages/Home"
import Login from "./components/pages/Login"
import JoinQueue from "./components/pages/JoinQueue"
import StatusQueue from "./components/pages/StatusQueue"
import Dashboard from "./components/pages/Dashboard"
import AdminDashboard from "./components/pages/admin/AdminDashboard"
import QueueManagement from "./components/pages/admin/QueueManagement"
import History from "./components/pages/History"
import HistoryDetail from "./components/pages/HistoryDetail"
import PatientDirectory from "./components/pages/admin/PatientDirectory"

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/join" element={<JoinQueue />} />
      <Route path="/status" element={<StatusQueue/>}/>
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/admin" element={<AdminDashboard />} />
      <Route path="/admin/queue" element={<QueueManagement />} />
      <Route path="/admin/patients" element={<PatientDirectory />} />
      <Route path="/history" element={<History />} />
      <Route path="/history/:id" element={<HistoryDetail />} />
    </Routes>
  )
}

export default App