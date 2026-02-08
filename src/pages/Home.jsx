import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import logo from "../assets/LOGOCV.png";

export default function Home() {
  return (
    <div
      className="min-h-screen flex flex-col justify-center items-center px-6 py-12 transition-colors duration-300 relative overflow-hidden"
      style={{ background: "var(--bg-page)" }}
    >
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
        <div className="absolute top-20 left-10 w-72 h-72 rounded-full blur-3xl opacity-30" style={{ background: "var(--primary)" }} />
        <div className="absolute bottom-32 right-10 w-96 h-96 rounded-full blur-3xl opacity-20" style={{ background: "var(--accent)" }} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="card-solid w-full max-w-md p-10 sm:p-12 text-center relative"
        style={{ boxShadow: "var(--shadow-card)" }}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.15, type: "spring", stiffness: 200, damping: 20 }}
          className="mb-8 flex justify-center"
        >
          <div
            className="w-28 h-28 rounded-3xl flex items-center justify-center overflow-hidden ring-4 transition-shadow"
            style={{
              boxShadow: "0 12px 40px -8px rgba(124, 58, 237, 0.35)",
              ringColor: "rgba(124, 58, 237, 0.2)",
            }}
          >
            <img src={logo} alt="VisionCam" className="w-full h-full object-contain p-2" />
          </div>
        </motion.div>
        <h1
          className="text-3xl sm:text-4xl font-bold tracking-tight mb-2 text-gradient"
          style={{ fontFamily: "var(--font-display)" }}
        >
          VisionCam
        </h1>
        <p className="text-sm sm:text-base mb-10" style={{ color: "var(--text-secondary)" }}>
          AI-powered driver safety monitoring
        </p>
        <Link to="/user-type">
          <motion.button
            type="button"
            className="btn-primary w-full py-4 text-lg rounded-2xl"
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
          >
            Get Started
          </motion.button>
        </Link>
      </motion.div>
    </div>
  );
}
