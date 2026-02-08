import { useState } from "react";
import { motion } from "framer-motion";
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

  async function signup() {
    try {
      const res = await fetch("http://localhost:3001/api/v1/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: f.name,
          age: f.age,
          gender: f.gender.toLowerCase(),
          phone: f.phone,
          emergencyname: f.emergencyName,
          emergencyphone: f.emergencyPhone,
          password: f.password,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.message || "Signup failed");
        return;
      }
      alert("Signup successful 🎉");
      window.location.href = "/login";
    } catch (err) {
      alert("Server error. Try again later.");
      console.error(err);
    }
  }

  const fields = [
    ["name", "Name", "text"],
    ["age", "Age", "text"],
    ["phone", "Phone Number", "text"],
    ["emergencyName", "Emergency Contact Name", "text"],
    ["emergencyPhone", "Emergency Contact Number", "text"],
    ["password", "Password", "password"],
  ];

  return (
    <div
      className="min-h-screen flex justify-center items-center px-6 py-12 transition-colors duration-300"
      style={{ background: "var(--bg-page)" }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="card-solid w-full max-w-md p-8 sm:p-10 rounded-3xl"
        style={{ boxShadow: "var(--shadow-card)" }}
      >
        <div className="w-20 h-20 mx-auto mb-6 rounded-2xl overflow-hidden flex items-center justify-center" style={{ background: "var(--gradient-primary)", boxShadow: "var(--shadow-soft)" }}>
          <img src={logo} alt="VisionCam" className="w-14 h-14 object-contain" />
        </div>
        <h2
          className="text-2xl font-bold text-center mb-6 text-gradient"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Create Account
        </h2>
        <div className="space-y-4 mb-5">
          {fields.map(([key, label, type]) => (
            <input
              key={key}
              placeholder={label}
              type={type}
              className="input rounded-2xl"
              value={f[key]}
              onChange={(e) => setF({ ...f, [key]: e.target.value })}
            />
          ))}
          <select
            value={f.gender}
            onChange={(e) => setF({ ...f, gender: e.target.value })}
            className="input rounded-2xl"
          >
            <option value="">Select Gender</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
        </div>
        <motion.button
          onClick={signup}
          className="btn-primary w-full py-3.5 rounded-2xl"
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.98 }}
        >
          Sign Up
        </motion.button>
      </motion.div>
    </div>
  );
}
