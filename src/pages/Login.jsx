import { useState } from "react";
import { motion } from "framer-motion";
import logo from "../assets/LOGOCV.png";

export default function Login() {
  const [form, setForm] = useState({ name: "", password: "" });

  async function login() {
    try {
      const res = await fetch("http://localhost:3001/api/v1/signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: form.name, password: form.password }),
      });
      const data = await res.json();

      if (res.status === 403) {
        alert(data.message);
        return;
      }
      if (!res.ok) {
        alert("Login failed");
        return;
      }

      localStorage.setItem("token", data.token);
      alert("You are logged in!");
      window.location.href = "/monitor";
    } catch (err) {
      alert("Server error. Try again later.");
      console.error(err);
    }
  }

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
          Login
        </h2>
        <input
          placeholder="Username"
          className="input mb-4 rounded-2xl"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
        <input
          placeholder="Password"
          type="password"
          className="input mb-6 rounded-2xl"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
        />
        <motion.button
          type="button"
          onClick={login}
          className="btn-primary w-full py-3.5 rounded-2xl"
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.98 }}
        >
          Continue
        </motion.button>
      </motion.div>
    </div>
  );
}
