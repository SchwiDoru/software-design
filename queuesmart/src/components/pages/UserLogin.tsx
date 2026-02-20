import Navbar from "../Navbar"
import { Link } from "react-router-dom"

function UserLogin() {
  return (
    <div className="min-h-screen"> 
      <Navbar />
      <div className="flex justify-center items-center py-20">
        <div className="card w-full max-w-md">
          <h2 className="text-2xl text-center mb-6 font-semibold text-foreground">User Login</h2>

          <div className="space-y-4">
            <input type="email" placeholder="Email" className="input-field" />
            <input type="password" placeholder="Password" className="input-field" />
            <button className="btn-primary w-full py-3">Login</button>
          </div>

          <div className="mt-6 space-y-3 text-center">
            <Link to="/forgot-password" title="reset password link" className="block text-sm text-accent hover:underline">
              Forgot Password?
            </Link>
            <Link to="/forgot-email" className="block text-sm text-muted-foreground hover:text-foreground">
              Forgot Email? Use Phone Number
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
export default UserLogin