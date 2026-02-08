import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

export default function UserType() {
  const navigate = useNavigate();

  return (
    <div
      className="min-h-screen flex justify-center items-center px-6 transition-colors duration-300"
      style={{ background: "var(--bg-page)" }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="card-solid w-full max-w-md p-10 sm:p-12 text-center"
        style={{ boxShadow: "var(--shadow-card)" }}
      >
        <h2
          className="text-2xl font-bold mb-10 text-gradient"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Continue as
        </h2>
        <div className="space-y-4">
          <motion.button
            type="button"
            onClick={() => navigate("/login")}
            className="btn-primary w-full py-4 text-lg rounded-2xl"
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
          >
            Existing User
          </motion.button>
          <motion.button
            type="button"
            onClick={() => navigate("/signup")}
            className="btn-secondary w-full py-4 text-lg rounded-2xl border-2"
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
          >
            New User
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}
