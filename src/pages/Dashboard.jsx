import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import logo from "../assets/LOGOCV.png";
import API from "../api";

export default function Dashboard() {
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setError("Not authenticated");
      setLoading(false);
      return;
    }
    fetch(`${API}/api/v1/profile`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (res) => {
        const contentType = res.headers.get("content-type") || "";
        const text = await res.text();
        if (!contentType.includes("application/json")) {
          if (res.ok) return setError("Server returned an unexpected response.");
          throw new Error(
            "Backend may not be running or returned HTML. Start the backend (e.g. run the server in the backend folder on port 3001) and try again."
          );
        }
        let data;
        try {
          data = JSON.parse(text);
        } catch {
          throw new Error(
            "Backend returned invalid data. Make sure the backend is running (port 3001) and the /api/v1/profile route is available."
          );
        }
        if (!res.ok) {
          throw new Error(data.message || "Failed to fetch profile");
        }
        setProfile(data);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]" style={{ color: "var(--primary)" }}>
        <motion.div
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
          className="text-lg font-medium"
        >
          Loading profile...
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="card-solid p-8 text-center"
        style={{ color: "var(--danger)" }}
      >
        <p className="font-semibold">{error}</p>
        <Link to="/login" className="btn-primary mt-4 inline-block">
          Go to Login
        </Link>
      </motion.div>
    );
  }

  const cardVariants = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 } };

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center overflow-hidden flex-shrink-0"
          style={{ background: "var(--gradient-primary)", boxShadow: "var(--shadow-soft)" }}
        >
          <img src={logo} className="w-10 h-10 object-contain" alt="VisionCam" />
        </div>
        <h1
          className="text-2xl sm:text-3xl font-bold text-gradient"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Dashboard
        </h1>
      </div>

      <motion.section
        variants={cardVariants}
        initial="initial"
        animate="animate"
        transition={{ delay: 0.1 }}
        className="card-solid p-6 sm:p-8 rounded-3xl"
        style={{ boxShadow: "var(--shadow-card)" }}
      >
        <h2 className="text-lg font-semibold mb-5" style={{ color: "var(--text-primary)" }}>
          Profile
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 text-sm">
          <p><span className="font-medium opacity-80">Name</span><br />{profile.username}</p>
          <p><span className="font-medium opacity-80">Age</span><br />{profile.age}</p>
          <p><span className="font-medium opacity-80">Gender</span><br />{profile.gender}</p>
          <p><span className="font-medium opacity-80">Phone</span><br />{profile.phone}</p>
          <p className="sm:col-span-2">
            <span className="font-medium opacity-80">Emergency</span><br />
            {profile.emergencyname} – {profile.emergencyphone}
          </p>
        </div>
        <motion.button
          type="button"
          className="btn-primary mt-6"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          Edit Profile
        </motion.button>
      </motion.section>

      <motion.section
        variants={cardVariants}
        initial="initial"
        animate="animate"
        transition={{ delay: 0.2 }}
        className="card-solid p-6 sm:p-8 rounded-3xl"
        style={{ boxShadow: "var(--shadow-card)" }}
      >
        <h2 className="text-lg font-semibold mb-5" style={{ color: "var(--text-primary)" }}>
          Emergency Contacts
        </h2>
        <p className="text-sm mb-6" style={{ color: "var(--text-secondary)" }}>
          {profile.emergencyname} – {profile.emergencyphone}
        </p>
        <motion.button
          type="button"
          className="btn-secondary"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          Add Contact
        </motion.button>
      </motion.section>
    </div>
  );
}
