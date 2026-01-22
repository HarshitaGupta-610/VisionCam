import { useState } from "react";
import logo from "../assets/LOGOCV.png";

export default function Login() {
  const [form, setForm] = useState({ name: "", password: "" });

  return (
    <div className="min-h-screen bg-[#F5F9FF] flex justify-center items-center px-6">

      <div className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-md border border-blue-100">

        <img src={logo} className="w-24 h-24 mx-auto mb-6" />

        <h2 className="text-2xl font-bold text-blue-600 text-center mb-6">
          Login
        </h2>

        <input
          placeholder="Name"
          className="w-full p-3 border rounded-xl mb-4 shadow-sm border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />

        <input
          placeholder="Password"
          type="password"
          className="w-full p-3 border rounded-xl mb-4 shadow-sm border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
          onChange={(e) => setForm({ ...form, password: e.target.value })}
        />

        <button
          onClick={() => (window.location.href = "/monitor")}
          className="w-full bg-blue-600 text-white py-3 rounded-xl shadow hover:bg-blue-700 active:scale-95"
        >
          Continue
        </button>

      </div>
    </div>
  );
}
