import Navbar from "../Navbar"

function Dashboard() {
  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />

      <div className="max-w-5xl mx-auto py-16 px-6">

        <h2 className="text-3xl font-bold mb-8">
          Staff Dashboard
        </h2>

        <div className="bg-white shadow-md rounded-xl p-6">

          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-semibold">
              Today's Queue
            </h3>

            <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">
              Serve Next Patient
            </button>
          </div>

          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-blue-50 text-left">
                <th className="p-3">#</th>
                <th className="p-3">Name</th>
                <th className="p-3">Service</th>
                <th className="p-3">Estimated Time</th>
              </tr>
            </thead>

            <tbody>
              <tr className="border-t">
                <td className="p-3">1</td>
                <td className="p-3">John Doe</td>
                <td className="p-3">General Consultation</td>
                <td className="p-3">9:30 AM</td>
              </tr>

              <tr className="border-t">
                <td className="p-3">2</td>
                <td className="p-3">Jane Smith</td>
                <td className="p-3">Follow-up Visit</td>
                <td className="p-3">10:00 AM</td>
              </tr>
            </tbody>
          </table>

        </div>
      </div>
    </div>
  )
}

export default Dashboard
