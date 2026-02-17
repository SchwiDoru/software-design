import Navbar from "../Navbar"
import { Link, useNavigate } from "react-router-dom";
import {useState} from "react";

function JoinQueue() {
  //List of services
  const [service, setService]=useState("");
  //user in queue
  const [peopleInQueue, setPeopleInQueue]=useState(7);//7 user ahead 
  //state for the name
  const [fullName, setFullName]=useState("");
  const navigate = useNavigate();
  const minutesPerPerson = 15;
  const totalMinutes = peopleInQueue * minutesPerPerson;
  
  //check info is filled to click join
  const handleJoin = () => {
    //check that both are filled name and services
    if(!fullName.trim()){
      alert("Please enter your full name.");
      return;
    }
    if (service === "") {
      alert("Please select a service first!");
      return;
    }
    // Increase the count by 1
    const updatedPeopleCount = peopleInQueue + 1;
    const updatedTotalMinutes = updatedPeopleCount * minutesPerPerson;
    alert(`You have joined the queue for ${service}!`);
    navigate("/status",{
      state:{
      totalMinutes: updatedTotalMinutes,
      fullName: fullName,
      position: updatedPeopleCount
      }
    });
  };

  //time formate, uisng computer time
  const formatWaitTime = (totalMin: number) => {
    const hours = Math.floor(totalMin / 60);
    const minutes = totalMin % 60;
    if (hours === 0) return `${minutes} minutes`;
    if (minutes === 0) return `${hours} hour${hours > 1 ? 's' : ''}`;
    return `${hours} hour${hours > 1 ? 's' : ''} ${minutes} minutes`;
  };
  //make emergency option red
  
  return (
    <div className="min-h-screen bg-blue-50">
      <Navbar />

      <div className="flex flex-col justify-center items-center py-20">
        <div className="bg-white shadow-lg rounded-xl p-10 w-full max-w-md">

          <h2 className="text-2xl font-bold text-center mb-6">
            Join Clinic Queue
          </h2>

          <input
            type="text"
            placeholder="Full Name (Last, First)"
            value = {fullName}
            onChange= {(e)=> setFullName(e.target.value)}
            className="w-full mb-4 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
          />

          <select
          value={service}
          onChange={(e)=>setService(e.target.value)}
            className="w-full mb-4 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
             <option value="" disabled>Select a service</option>
            <option>General Consultation</option>
            <option>Follow-up Visit</option>
            <option>Medical Certificate</option>
            
            <option>Analysis</option>
            <option>shots/vaccine</option>
            <option className="bg-red-200">Emergency</option>
            
          </select>

          <button onClick={handleJoin}
          className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition">
            Confirm Booking
          </button>

          {/* Example estimate display */}
          <div className="mt-6 p-4 bg-blue-100 rounded-lg text-center">
            <p className="font-medium text-blue-800">
              Estimated Wait Time: {formatWaitTime(totalMinutes)}
            </p>
            <p className="text-sm text-blue-700 mt-1">
              Expected Consultation Time: {new Date(Date.now() + totalMinutes * 60000).toLocaleTimeString([],{hour: '2-digit', minute:'2-digit'})}
            </p>
          </div>
        </div>
        <div className="mt-6 ">{/*to go to home page*/}
          <Link
          to="/"
          className="text-gray-400 hover:text-gray-600 transition-colors text-sm font-medium tracking-wide">
             
            Back to Home Page
          </Link>
        </div>
      </div>
    </div>
  )
}

export default JoinQueue
