import Navbar from "../Navbar"
import { Link } from "react-router-dom"

function Home() {
  return (
    <div className="min-h-screen bg-blue-50">
      <Navbar />

      <div className="flex flex-col items-center justify-center text-center px-6 py-20">
        <h1 className="text-5xl font-bold text-gray-800 mb-6">
          Smart Clinic Queue Management
        </h1>

        <p className="text-gray-600 max-w-2xl mb-8">
          We operate from 9:00 AM to 5:00 PM.
          Each consultation lasts 30 minutes.
          Book your slot digitally and avoid unnecessary waiting.
        </p>

        <Link
          to="/join"
          className="bg-blue-600 text-white px-8 py-3 rounded-lg shadow-md hover:bg-blue-700 transition"
        >
          Join Now
        </Link>
      </div>
    </div>
  )
}

export default Home
