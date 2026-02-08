import { Outlet } from "react-router-dom";
import { motion } from "framer-motion";
import Navbar from "./Navbar";

const pageVariants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -4 },
};

export default function AppLayout() {
  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Subtle animated gradient background */}
      <div
        className="fixed inset-0 -z-10 bg-gradient-motion opacity-90 dark:opacity-95"
        style={{ background: "var(--bg-page)" }}
      />
      <div
        className="fixed inset-0 -z-10"
        style={{
          background: "radial-gradient(ellipse 90% 60% at 50% -10%, rgba(124, 58, 237, 0.2), transparent 50%), radial-gradient(ellipse 70% 50% at 100% 30%, rgba(139, 92, 246, 0.12), transparent), radial-gradient(ellipse 70% 50% at 0% 70%, rgba(124, 58, 237, 0.1), transparent)",
        }}
      />
      <div className="fixed inset-0 -z-10 opacity-40 dark:opacity-25 pointer-events-none" aria-hidden>
        <div className="absolute top-1/4 left-1/4 w-[24rem] h-[24rem] rounded-full blur-3xl animate-pulse" style={{ background: "rgba(167, 139, 250, 0.25)", animationDuration: "4s" }} />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full blur-3xl animate-pulse" style={{ background: "rgba(139, 92, 246, 0.2)", animationDuration: "5s", animationDelay: "1s" }} />
      </div>

      <Navbar />
      <motion.main
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={{ duration: 0.25 }}
        className="relative mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8"
      >
        <Outlet />
      </motion.main>

    </div>
  );
}
