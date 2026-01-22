import { useState, useEffect } from "react";
import logo from "../assets/LOGOCV.png";

export default function Monitor() {

  const [time, setTime] = useState("");

  useEffect(() => {
    setInterval(() => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      );
    }, 1000);
  }, []);

  return (
    <div className="min-h-screen bg-white px-6 py-4">

      {/* Top Bar */}
      <div className="flex items-center justify-between mb-6">
        
        <div className="flex items-center gap-2">
          <img src={logo} className="w-10 h-10" />
          <h1 className="text-xl font-bold text-blue-600">VisionCam</h1>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-gray-600 font-medium">{time}</span>

          <span
            onClick={() => (window.location.href = "/settings")}
            className="material-icons-outlined text-3xl text-gray-600 cursor-pointer hover:text-blue-600 transition"
          >
            settings
          </span>
        </div>

      </div>

      {/* Camera Preview */}
      <div className="w-full h-80 bg-blue-50 rounded-2xl border border-blue-100 shadow-inner flex flex-col justify-center items-center">
        <div className="w-24 h-24 bg-blue-100 rounded-xl"></div>
        <p className="mt-3 text-gray-600">Camera Preview</p>
      </div>

      {/* Status */}
      <div className="grid grid-cols-3 gap-4 mt-6">

        {[
          ["Drowsiness Detection", "Stable"],
          ["Face Direction", "Forward"],
          ["Phone Usage", "Safe"],
        ].map(([title, status]) => (
          <div key={title} className="bg-white rounded-xl p-4 shadow border border-gray-200 text-center">
            <h3 className="text-sm font-semibold text-gray-700">{title}</h3>
            <p className="mt-2 text-blue-600 font-bold">{status}</p>
          </div>
        ))}

      </div>

      <button className="mt-8 w-full py-4 bg-blue-600 text-white rounded-xl shadow hover:bg-blue-700 active:scale-95 text-lg font-semibold">
        Start Monitoring
      </button>

    </div>
  );
}
