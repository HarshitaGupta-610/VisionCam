import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import API from "../api";

export default function Alerts() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchAlerts = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API}/api/v1/events`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Server Error: ${text}`);
      }
      const data = await res.json();
      setAlerts(data);
    } catch (err) {
      console.log("Failed to fetch alerts:", err);
      setError("Cannot load alerts. Is backend running?");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 5000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      day: "numeric",
      month: "short",
    });
  };

  const isEmergency = (a) => a.type === "call";

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1
          className="text-2xl sm:text-3xl font-bold text-gradient"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Alerts & History
        </h1>
        <Link
          to="/monitor"
          className="text-sm font-medium hover:underline"
          style={{ color: "var(--primary)" }}
        >
          Back to Monitor
        </Link>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-16" style={{ color: "var(--text-muted)" }}>
          <motion.div
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ repeat: Infinity, duration: 1.2 }}
            className="text-sm font-medium"
          >
            Loading alerts...
          </motion.div>
        </div>
      )}

      {error && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="card-solid p-6 text-center"
          style={{ color: "var(--danger)" }}
        >
          <p className="font-semibold">{error}</p>
        </motion.div>
      )}

      {!loading && alerts.length === 0 && !error && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="card-solid flex flex-col items-center justify-center py-20 px-8 text-center rounded-3xl"
          style={{ boxShadow: "var(--shadow-card)" }}
        >
          <motion.div
            className="w-28 h-28 rounded-full flex items-center justify-center text-5xl mb-6"
            style={{ background: "var(--gradient-primary)", boxShadow: "0 12px 32px -8px rgba(124, 58, 237, 0.4)" }}
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2.5, repeat: Infinity }}
          >
            ✓
          </motion.div>
          <h2
            className="text-xl font-bold mb-2 text-gradient"
            style={{ fontFamily: "var(--font-display)" }}
          >
            You're all safe.
          </h2>
          <p className="text-sm max-w-sm" style={{ color: "var(--text-secondary)" }}>
            No alerts detected. Keep driving safely.
          </p>
        </motion.div>
      )}

      <AnimatePresence mode="popLayout">
        {!loading && alerts.length > 0 && (
          <motion.ul
            initial="hidden"
            animate="visible"
            variants={{ visible: { transition: { staggerChildren: 0.06 } } }}
            className="space-y-4"
          >
            {alerts.map((a) => (
              <motion.li
                key={a._id}
                layout
                variants={{
                  hidden: { opacity: 0, x: -12 },
                  visible: { opacity: 1, x: 0 },
                }}
                className="card-solid overflow-hidden flex rounded-2xl"
                style={{ boxShadow: "var(--shadow-soft)" }}
                whileHover={{ y: -2 }}
              >
                <div
                  className="w-2 shrink-0 rounded-l-2xl"
                  style={{
                    background: isEmergency(a) ? "var(--danger)" : "var(--warning)",
                  }}
                />
                <div className="flex-1 p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex items-start gap-4">
                    <span
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xl"
                      style={{ background: "var(--glass)" }}
                    >
                      {isEmergency(a) ? "🚨" : "⚠️"}
                    </span>
                    <div>
                      <h3
                        className="font-semibold"
                        style={{
                          color: isEmergency(a) ? "var(--danger)" : "var(--warning)",
                        }}
                      >
                        {isEmergency(a) ? "Emergency Call Triggered" : "Warning Sent"}
                      </h3>
                      <p className="text-sm mt-0.5" style={{ color: "var(--text-secondary)" }}>
                        {a.conditions?.join(", ") || "Unsafe driving detected"}
                      </p>
                      <p className="text-xs mt-2" style={{ color: "var(--text-muted)" }}>
                        Warning count: {a.count}
                      </p>
                    </div>
                  </div>
                  <p
                    className="text-xs font-medium tabular-nums shrink-0"
                    style={{ color: "var(--text-muted)" }}
                  >
                    {formatTime(a.createdAt)}
                  </p>
                </div>
              </motion.li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}
