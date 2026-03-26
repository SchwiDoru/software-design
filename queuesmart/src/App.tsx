import { Routes, Route } from "react-router-dom"
import Home from "./components/pages/Home"
import JoinQueue from "./components/pages/JoinQueue"
import StatusQueue from "./components/pages/StatusQueue"
import Dashboard from "./components/pages/Dashboard"
import AdminDashboard from "./components/pages/admin/AdminDashboard"
import PendingQueueEntries from "./components/pages/admin/PendingQueueEntries"
import QueueManagement from "./components/pages/admin/QueueManagement"
import History from "./components/pages/History"
import HistoryDetail from "./components/pages/HistoryDetail"
import PatientDirectory from "./components/pages/admin/PatientDirectory"
import PatientDetail from "./components/pages/admin/PatientDetail"

import UserLogin from "./components/pages/UserLogin"
import StaffLogin from "./components/pages/StaffLogin"
import ForgotEmail from "./components/pages/ForgotEmail"
import ForgotPassword from "./components/pages/ForgotPassword"
import StaffForgotPassword from "./components/pages/StaffForgotPassword"
import UserUpdatePassword from "./components/pages/UserUpdatePassword"
import StaffUpdatePassword from "./components/pages/StaffUpdatePassword"
import UserRegister from "./components/pages/UserRegister"
import ProtectedRoute from "./components/auth/ProtectedRoute"
import GuestRoute from "./components/auth/GuestRoute"

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      
      <Route element={<ProtectedRoute allowedRoles={["Patient"]} />}>
        <Route path="/join" element={<JoinQueue />} />
        <Route path="/status" element={<StatusQueue/>}/>
        <Route path="/dashboard" element={<Dashboard />} />
      </Route>
      
      {/* Auth Routes */}
      <Route element={<GuestRoute />}>
        <Route path="/login" element={<UserLogin />} />
        <Route path="/register" element={<UserRegister />} />
        <Route path="/staff-login" element={<StaffLogin />} />
      </Route>
      <Route path="/forgot-email" element={<ForgotEmail />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/staff-forgot-password" element={<StaffForgotPassword />} />
      <Route path="/update-password" element={<UserUpdatePassword />} />
      <Route path="/staff/update-password" element={<StaffUpdatePassword />} />

      {/* Admin Routes */}
      <Route element={<ProtectedRoute allowedRoles={["Admin", "Staff"]} />}>
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/queue" element={<QueueManagement />} />
        <Route path="/admin/pending" element={<PendingQueueEntries />} />
        <Route path="/admin/patients" element={<PatientDirectory />} />
        <Route path="/admin/patients/:id" element={<PatientDetail />} />
      </Route>
      
      {/* History Routes */}
      <Route path="/history" element={<History />} />
      <Route path="/history/:id" element={<HistoryDetail />} />
    </Routes>
  )
}

export default App
