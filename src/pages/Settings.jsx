import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useTheme } from "../context/ThemeContext";

export default function Settings() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.href = "/";
  };

  const sections = [
    {
      title: "Alerts & History",
      description: "View past warnings and events",
      onClick: () => navigate("/alerts"),
      icon: "🔔",
    },
    {
      title: "Dashboard",
      description: "Profile and emergency contacts",
      onClick: () => navigate("/dashboard"),
      icon: "👤",
    },
    {
      title: "Theme",
      description: theme === "light" ? "Dark mode" : "Light mode",
      onClick: toggleTheme,
      icon: theme === "light" ? "🌙" : "☀️",
    },
  ];

  return (
    <div className="space-y-8">
      <h1
        className="text-2xl sm:text-3xl font-bold text-gradient"
        style={{ fontFamily: "var(--font-display)" }}
      >
        Settings
      </h1>

      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wider mb-4" style={{ color: "var(--text-muted)" }}>
          Preferences
        </h2>
        <div className="space-y-4">
          {sections.map((item, i) => (
            <motion.button
              key={item.title}
              type="button"
              onClick={item.onClick}
              className="card-solid w-full p-5 flex items-center gap-4 text-left rounded-2xl"
              style={{ boxShadow: "var(--shadow-soft)" }}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              whileHover={{ y: -3 }}
              whileTap={{ scale: 0.99 }}
            >
              <span
                className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
                style={{ background: "var(--glass)", border: "1px solid var(--border-subtle)" }}
              >
                {item.icon}
              </span>
              <div className="flex-1 min-w-0">
                <p className="font-semibold" style={{ color: "var(--text-primary)" }}>
                  {item.title}
                </p>
                <p className="text-sm mt-0.5" style={{ color: "var(--text-secondary)" }}>
                  {item.description}
                </p>
              </div>
              <span className="text-lg opacity-60">›</span>
            </motion.button>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wider mb-4" style={{ color: "var(--text-muted)" }}>
          Account
        </h2>
        <motion.button
          type="button"
          onClick={handleLogout}
          className="card-solid w-full p-5 flex items-center gap-4 text-left rounded-2xl"
          style={{
            boxShadow: "var(--shadow-soft)",
            color: "var(--danger)",
          }}
          whileHover={{ y: -3 }}
          whileTap={{ scale: 0.99 }}
        >
          <span
            className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
            style={{ background: "rgba(220, 38, 38, 0.1)", border: "1px solid rgba(220, 38, 38, 0.2)" }}
          >
            🚪
          </span>
          <div className="flex-1">
            <p className="font-semibold">Log out</p>
            <p className="text-sm mt-0.5 opacity-80">Sign out of your account</p>
          </div>
          <span className="text-lg opacity-60">›</span>
        </motion.button>
      </section>
    </div>
  );
}
