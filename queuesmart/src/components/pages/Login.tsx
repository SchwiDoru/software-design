import Navbar from "../Navbar"
import { useState } from "react"

function Login() {
  const [role, setRole] = useState("user");

  return (
    <div className="min-h-screen"> 
      <Navbar />

      <div className="flex justify-center items-center py-20">
        {/* Used the .card class here */}
        <div className="card w-full max-w-md">

          <h2 className="text-2xl text-center mb-6">
            {role === "user" ? "User Login" : "Staff Login"}
          </h2>

          {/* Role Switch */}
          <div className="flex justify-center mb-6 space-x-4">
            <button
              onClick={() => setRole("user")}
              className={role === "user" ? "btn-primary" : "btn-secondary"}
            >
              User
            </button>

            <button
              onClick={() => setRole("staff")}
              className={role === "staff" ? "btn-primary" : "btn-secondary"}
            >
              Staff
            </button>
          </div>

          {/* Form - Used .input-field class here */}
          <input
            type="email"
            placeholder="Email"
            className="input-field mb-4"
          />

          <input
            type="password"
            placeholder="Password"
            className="input-field mb-6"
          />

          <button className="btn-primary w-full">
            Login
          </button>
        </div>
      </div>
    </div>
  );
}

export default Login
