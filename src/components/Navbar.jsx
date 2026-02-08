import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import logo from "../assets/LOGOCV.png";
import { useTheme } from "../context/ThemeContext";

export default function Navbar() {
  const { theme, toggleTheme } = useTheme();

  return (
    <nav
      className="sticky top-0 z-50 w-full border-b transition-all duration-300"
      style={{
        background: "var(--bg-nav)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderColor: "var(--border-subtle)",
        boxShadow: "0 1px 0 0 var(--border-subtle)",
      }}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link to="/monitor" className="flex items-center gap-3 group">
          <motion.span
            className="flex h-10 w-10 items-center justify-center rounded-xl overflow-hidden ring-2 transition-all duration-300 group-hover:ring-4"
            style={{
              ringColor: "rgba(124, 58, 237, 0.35)",
              boxShadow: "0 4px 12px -2px rgba(124, 58, 237, 0.25)",
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
          >
            <img src={logo} alt="VisionCam" className="h-full w-full object-contain p-1" />
          </motion.span>
          <span
            className="text-xl font-bold tracking-tight bg-gradient-to-r from-[var(--primary)] to-[var(--accent)] bg-clip-text text-transparent"
            style={{ fontFamily: "var(--font-display)" }}
          >
            VisionCam
          </span>
        </Link>

        <div className="flex items-center gap-2 sm:gap-3">
          <motion.button
            type="button"
            aria-label="Toggle theme"
            onClick={toggleTheme}
            className="flex h-11 w-11 items-center justify-center rounded-2xl text-xl transition-all duration-300"
            style={{
              background: "var(--glass)",
              color: "var(--text-primary)",
              border: "1px solid var(--border-subtle)",
              boxShadow: "var(--shadow-soft)",
            }}
            whileHover={{ scale: 1.06, y: -1 }}
            whileTap={{ scale: 0.94 }}
          >
            {theme === "light" ? "🌙" : "☀️"}
          </motion.button>
          <Link to="/settings">
            <motion.span
              className="flex h-11 w-11 items-center justify-center rounded-2xl text-xl transition-all duration-300"
              style={{
                background: "var(--glass)",
                color: "var(--text-primary)",
                border: "1px solid var(--border-subtle)",
                boxShadow: "var(--shadow-soft)",
              }}
              whileHover={{ scale: 1.06, y: -1 }}
              whileTap={{ scale: 0.94 }}
            >
              ⚙️
            </motion.span>
          </Link>
          <Link to="/dashboard">
            <motion.span
              className="flex h-11 w-11 items-center justify-center rounded-2xl text-xl transition-all duration-300"
              style={{
                background: "var(--glass)",
                color: "var(--text-primary)",
                border: "1px solid var(--border-subtle)",
                boxShadow: "var(--shadow-soft)",
              }}
              whileHover={{ scale: 1.06, y: -1 }}
              whileTap={{ scale: 0.94 }}
            >
              👤
            </motion.span>
          </Link>
        </div>
      </div>
    </nav>
  );
}
