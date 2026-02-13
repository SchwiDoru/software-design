import { Link } from "react-router-dom"

function Navbar() {
  return (
    <nav className="bg-white shadow-md px-6 py-4 flex justify-between items-center">
      <Link to="/" className="text-2xl font-bold text-blue-600">
        QueueSmart Clinic
      </Link>

      <div className="space-x-6">
        <Link to="/join" className="text-gray-700 hover:text-blue-600">
          Join Queue
        </Link>

        <Link to="/login" className="text-gray-700 hover:text-blue-600">
          Login
        </Link>
      </div>
    </nav>
  )
}

export default Navbar
