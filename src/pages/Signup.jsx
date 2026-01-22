import { useState } from "react";
import logo from "../assets/LOGOCV.png";

export default function Signup() {
  const [f, setF] = useState({
    name: "",
    age: "",
    gender: "",
    phone: "",
    emergencyName: "",
    emergencyPhone: "",
    password: "",
  });

  return (
    <div className="min-h-screen bg-[#F5F9FF] flex justify-center items-center px-6">

      <div className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-md border border-blue-100">

        <img src={logo} className="w-24 h-24 mx-auto mb-6" />

        <h2 className="text-2xl font-bold text-blue-600 text-center mb-6">
          Create Account
        </h2>

        {[
          ["name", "Name"],
          ["age", "Age"],
          ["gender", "Gender"],
          ["phone", "Phone Number"],
          ["emergencyName", "Emergency Contact Name"],
          ["emergencyPhone", "Emergency Contact Number"],
          ["password", "Password"],
        ].map(([key, label]) => (
          <input
            key={key}
            placeholder={label}
            type={key === "password" ? "password" : "text"}
            className="w-full p-3 border rounded-xl mb-4 shadow-sm border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
            onChange={(e) => setF({ ...f, [key]: e.target.value })}
          />
        ))}

        <button
          onClick={() => (window.location.href = "/monitor")}
          className="w-full bg-blue-600 text-white py-3 rounded-xl shadow hover:bg-blue-700 active:scale-95"
        >
          Sign Up
        </button>

      </div>
    </div>
  );
}

