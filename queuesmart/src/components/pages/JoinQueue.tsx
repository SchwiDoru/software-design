import Navbar from "../Navbar"

function JoinQueue() {
  return (
    <div className="min-h-screen bg-blue-50">
      <Navbar />

      <div className="flex justify-center items-center py-20">
        <div className="bg-white shadow-lg rounded-xl p-10 w-full max-w-md">

          <h2 className="text-2xl font-bold text-center mb-6">
            Join Clinic Queue
          </h2>

          <input
            type="text"
            placeholder="Full Name"
            className="w-full mb-4 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
          />

          <select
            className="w-full mb-4 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            <option>General Consultation</option>
            <option>Follow-up Visit</option>
            <option>Medical Certificate</option>
          </select>

          <button className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition">
            Confirm Booking
          </button>

          {/* Example estimate display */}
          <div className="mt-6 p-4 bg-blue-100 rounded-lg text-center">
            <p className="font-medium text-blue-800">
              Estimated Wait Time: 1 hour 30 minutes
            </p>
            <p className="text-sm text-blue-700 mt-1">
              Expected Consultation Time: 11:30 AM
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default JoinQueue
