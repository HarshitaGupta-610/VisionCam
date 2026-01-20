import { useState, useEffect } from "react";
import logo from "../assets/LOGOCV.png";

export default function Monitor() {
  const [time, setTime] = useState("");

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const formatted = now.toLocaleTimeString("en-US", {
        hour12: false,
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
      setTime(formatted);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-white px-6 pt-4 flex flex-col">

      {/* NAVBAR */}
      <div className="flex items-center justify-between py-3">
        <div className="flex items-center gap-2">
          <img src={logo} className="w-8 h-8 rounded-md" alt="logo" />
          <h1 className="text-xl font-semibold text-blue-600">VisionCam</h1>
        </div>

        <div className="flex items-center gap-4 text-gray-600">
          <span className="font-medium">{time}</span>
          <span className="text-xl">⚙️</span>
        </div>
      </div>

      {/* CAMERA PREVIEW */}
      <div className="bg-blue-50 border border-blue-100 shadow-inner rounded-2xl flex flex-col items-center justify-center h-80 mt-4">
        <span className="text-5xl text-blue-300">👁️</span>
        <p className="text-gray-700 font-medium mt-2">Camera Preview</p>
        <p className="text-gray-400 text-sm">Press Start to begin monitoring</p>
      </div>

      {/* STATUS CARDS */}
      <div className="grid grid-cols-3 gap-4 mt-6">

        <div className="bg-white shadow-md rounded-xl py-4 flex flex-col items-center">
          <span className="text-2xl text-green-500">👁️</span>
          <p className="text-gray-600 text-sm mt-1">Eye Status</p>
          <p className="text-green-600 text-sm font-semibold mt-1">Open</p>
        </div>

        <div className="bg-white shadow-md rounded-xl py-4 flex flex-col items-center">
          <span className="text-2xl text-blue-500">➡️</span>
          <p className="text-gray-600 text-sm mt-1">Face Direction</p>
          <p className="text-blue-600 text-sm font-semibold mt-1">Forward</p>
        </div>

        <div className="bg-white shadow-md rounded-xl py-4 flex flex-col items-center">
          <span className="text-2xl text-green-500">📱</span>
          <p className="text-gray-600 text-sm mt-1">Phone</p>
          <p className="text-green-600 text-sm font-semibold mt-1">Safe</p>
        </div>

      </div>

      {/* BUTTONS */}
      <button className="mt-6 bg-blue-600 hover:bg-blue-700 text-white w-full py-4 rounded-xl shadow-lg font-semibold">
        Start Monitoring
      </button>

      <div className="mt-4 text-center space-y-2">
        <a href="/alerts" className="text-blue-500 text-sm underline block">
          View Alerts & History
        </a>

        <a href="/dashboard" className="text-blue-500 text-sm underline block">
          Go to Dashboard
        </a>
      </div>

    </div>
  );
}
