import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import API from "../api";

const API_BASE =
  import.meta.env.VITE_API_BASE || "http://localhost:8000";
const BACKEND_API = API;
const CAPTURE_INTERVAL_MS = 350;
const ML_HELP =
  "Start the ml (see ml/README.md): uvicorn ml.ml_server:app --port 8000";

// Derive face direction from head_pose when API doesn't send direction
const YAW_LIMIT = 18;
const PITCH_LIMIT = 14;
function directionFromHeadPose(headPose) {
  if (!headPose) return null;
  const yaw = Number(headPose.yaw);
  const pitch = Number(headPose.pitch);
  if (Number.isNaN(yaw) || Number.isNaN(pitch)) return null;
  if (Math.abs(pitch) > Math.abs(yaw) + 5) {
    if (pitch > PITCH_LIMIT) return "down";
    if (pitch < -PITCH_LIMIT) return "up";
    return "forward";
  }
  if (yaw > YAW_LIMIT) return "right";
  if (yaw < -YAW_LIMIT) return "left";
  return "forward";
}

//////////////////////////////////////////////////////////////
// 🔊 ALARM
//////////////////////////////////////////////////////////////
function startAlarm(audioCtxRef, oscillatorRef) {
  if (oscillatorRef.current) return;

  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const oscillator = audioCtx.createOscillator();
  const gainNode = audioCtx.createGain();

  oscillator.type = "square";
  oscillator.frequency.setValueAtTime(900, audioCtx.currentTime);
  gainNode.gain.setValueAtTime(0.25, audioCtx.currentTime);

  oscillator.connect(gainNode);
  gainNode.connect(audioCtx.destination);
  oscillator.start();

  audioCtxRef.current = audioCtx;
  oscillatorRef.current = oscillator;
}

function stopAlarm(audioCtxRef, oscillatorRef) {
  if (oscillatorRef.current) {
    oscillatorRef.current.stop();
    oscillatorRef.current.disconnect();
    oscillatorRef.current = null;
  }
  if (audioCtxRef.current) {
    audioCtxRef.current.close();
    audioCtxRef.current = null;
  }
}

export default function Monitor() {
  const [time, setTime] = useState("");
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [stream, setStream] = useState(null);
  const [eyeStatus, setEyeStatus] = useState("—");
  const [faceDirection, setFaceDirection] = useState("—");
  const [yawnStatus, setYawnStatus] = useState("—");
  const [earVal, setEarVal] = useState("—");
  const [marVal, setMarVal] = useState("—");
  const [error, setError] = useState(null);
  const [apiError, setApiError] = useState(null);
  const [alertActive, setAlertActive] = useState(false);
  const [alertMsg, setAlertMsg] = useState(null);
  const alertLatchRef = useRef(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const loopRef = useRef(null);
  const sendingRef = useRef(false);
  const audioCtxRef = useRef(null);
  const oscillatorRef = useRef(null);
  const isMonitoringRef = useRef(false);
  const eyeClosedStartRef = useRef(null);
  const warningCooldownRef = useRef(0);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString("en-US", {
          hour12: false,
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      );
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    return () => {
      if (loopRef.current) clearInterval(loopRef.current);
      if (stream) stream.getTracks().forEach((t) => t.stop());
    };
  }, [stream]);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  const startMonitoring = async () => {
    setError(null);
    setApiError(null);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: "user",
        },
      });
      setStream(mediaStream);
      setIsMonitoring(true);
      isMonitoringRef.current = true;
    } catch (e) {
      setError("Could not access camera. Please allow camera access.");
      return;
    }
  };

  const handleStop = () => {
    if (loopRef.current) {
      clearInterval(loopRef.current);
      loopRef.current = null;
    }
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
      setStream(null);
    }
    if (videoRef.current) videoRef.current.srcObject = null;
    stopAlarm(audioCtxRef, oscillatorRef);
    setEyeStatus("—");
    setYawnStatus("—");
    setFaceDirection("—");
    setEarVal("—");
    setMarVal("—");
    setApiError(null);
    setError(null);
    setIsMonitoring(false);
    isMonitoringRef.current = false;
    eyeClosedStartRef.current = null;
  };

  function speakAlert(text) {
    const synth = window.speechSynthesis;
    if (!synth) return;

    // stop previous speech if still talking
    synth.cancel();

    const utter = new SpeechSynthesisUtterance(text);
    utter.rate = 1.0;
    utter.pitch = 1.0;
    utter.volume = 1.0;

    synth.speak(utter);
  }

  //////////////////////////////////////////////////////////////
  // ⭐ SEND WARNING TO BACKEND
  //////////////////////////////////////////////////////////////
  const sendWarning = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    const now = Date.now();
    // Prevent backend spam
    if (now - warningCooldownRef.current < 15000) return;
    warningCooldownRef.current = now;

    try {
      await fetch(`${BACKEND_API}/api/v1/warning`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      console.log("⚠️ Warning sent to backend");
    } catch (err) {
      console.log("Warning API error:", err);
    }
  };

  useEffect(() => {
    if (!isMonitoring || !stream) return;

    const sendFrame = async () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas) return;
      if (video.readyState !== video.HAVE_ENOUGH_DATA) return;
      if (video.videoWidth <= 0 || video.videoHeight <= 0) return;
      if (sendingRef.current) return;

      sendingRef.current = true;
      const ctx = canvas.getContext("2d");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0);

      const blob = await new Promise((resolve) =>
        canvas.toBlob(resolve, "image/jpeg", 0.95)
      );
      if (!blob) {
        sendingRef.current = false;
        return;
      }

      const formData = new FormData();
      formData.append("file", blob, "frame.jpg");

      try {
        const res = await fetch(`${API_BASE}/api/detect`, {
          method: "POST",
          body: formData,
        });
        let data = {};
        try {
          data = await res.json();
          console.log("API detect response:", data);
        } catch (_) {
          /* ignore non-JSON body */
        }
        if (!res.ok) {
          throw new Error(
            (data && data.detail) || res.statusText || "Request failed"
          );
        }
        if (!isMonitoringRef.current) return;
        setApiError(null);

        /////////////////////////////////////////////////////////
        // ⭐ DETECTION
        /////////////////////////////////////////////////////////
        const eyeClosed = data.drowsiness?.eye_status === "closed";
        const yawning = data.drowsiness?.yawn_detected;

        setEyeStatus(
          eyeClosed ? "Closed" : "Open"
        );

        // Show direction whenever we have it (API or head_pose); "Calibrating..." only when no direction at all
        const rawDir = data.distraction?.direction;
        const headPose = data.distraction?.head_pose;
        const hasFace = data.drowsiness?.eye_status !== "no_face";
        const headPoseHasData =
          headPose &&
          (Number(headPose.yaw) !== 0 || Number(headPose.pitch) !== 0);
        const faceDir =
          rawDir && rawDir !== "unknown"
            ? rawDir
            : hasFace && headPose
              ? directionFromHeadPose(headPose)
              : headPoseHasData
                ? directionFromHeadPose(headPose)
                : null;
        if (faceDir) {
          setFaceDirection(
            faceDir.charAt(0).toUpperCase() + faceDir.slice(1)
          );
        } else if (data.distraction && !data.distraction.calibrated) {
          setFaceDirection("Calibrating...");
        } else {
          setFaceDirection("—");
        }

        // Yawn status
        setYawnStatus(yawning ? "Yawning" : "Normal");
        setEarVal(data.drowsiness?.ear?.toFixed(3) || "—");
        setMarVal(data.drowsiness?.mar?.toFixed(3) || "—");
        
        // Debug yawn detection
        if (data.drowsiness?.mar !== undefined) {
          console.log("MAR:", data.drowsiness.mar, "Yawn detected:", yawning);
        }

        // Eye closed alarm trigger
        if (eyeClosed) {
          startAlarm(audioCtxRef, oscillatorRef);
          if (eyeClosedStartRef.current === null) {
            eyeClosedStartRef.current = Date.now();
          }
          // Send warning to backend after eye closed for 2 seconds
          if (Date.now() - eyeClosedStartRef.current > 2000) {
            const token = localStorage.getItem("token");
            if (token) {
              fetch(`${BACKEND_API}/api/v1/warning`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`,
                },
              }).catch((err) => console.log("Warning API error:", err));
            }
            eyeClosedStartRef.current = Date.now(); // Reset to prevent spam
          }
        } else {
          stopAlarm(audioCtxRef, oscillatorRef);
          eyeClosedStartRef.current = null;
        }

        // Send warning for yawning only (removed distraction from here)
        if (yawning) {
          sendWarning();
        }

        // ✅ attention alert trigger
        const alertNow = data.distraction?.attention_alert === true;
        const lookingAway = data.distraction?.looking_away === true;
        const dir =
          data.distraction?.away_direction ||
          data.distraction?.direction ||
          "away";

        // Debug logging
        if (data.distraction) {
          console.log("Distraction:", {
            attention_alert: data.distraction.attention_alert,
            away_duration: data.distraction.away_duration,
            looking_away: data.distraction.looking_away,
            direction: data.distraction.direction,
            away_direction: data.distraction.away_direction,
            calibrated: data.distraction.calibrated
          });
        }

        // ✅ RESET latch when alert not active
        if (!alertNow) {
          alertLatchRef.current = false;
        }

        // Trigger alert when attention_alert is true
        if (alertNow && !alertLatchRef.current) {
          const msg = `Warning. You are looking ${dir} for too long. Please look forward.`;

          setAlertMsg(`⚠️ Attention Risk — Looking ${dir.toUpperCase()} too long`);
          speakAlert(msg); // ✅ SPEAK HERE
          sendWarning(); // Also send warning to backend

          alertLatchRef.current = true;
          console.log("🚨 ATTENTION ALERT FIRED:", msg);

          // Keep banner visible longer - only hide when looking forward again
          // Don't auto-hide, let it stay until user looks forward
        }

        // Clear alert message when user looks forward again
        if (!lookingAway && alertMsg) {
          setTimeout(() => {
            setAlertMsg(null);
          }, 2000);
        }


      } catch (err) {
        const isNetworkError =
          !err.message || err.message === "Failed to fetch";
        const message = isNetworkError
          ? `Cannot connect to ${API_BASE}. ${ML_HELP}`
          : err.message;
        setApiError(message);
        setEyeStatus("—");
        setFaceDirection("—");
        setYawnStatus("—");
        setEarVal("—");
        setMarVal("—");
      } finally {
        sendingRef.current = false;
      }
    };

    const startAfterVideoReady = () => {
      const video = videoRef.current;
      if (video && video.videoWidth > 0 && video.videoHeight > 0) {
        sendFrame();
        loopRef.current = setInterval(sendFrame, CAPTURE_INTERVAL_MS);
        return;
      }
      setTimeout(startAfterVideoReady, 100);
    };

    const timeoutId = setTimeout(startAfterVideoReady, 300);

    return () => {
      clearTimeout(timeoutId);
      if (loopRef.current) {
        clearInterval(loopRef.current);
        loopRef.current = null;
      }
    };
  }, [isMonitoring, stream]);

  const hasDanger = eyeStatus === "Closed" || yawnStatus === "Yawning" || alertMsg;

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <h1
          className="text-xl sm:text-2xl font-bold text-gradient"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Live Monitor
        </h1>
        <span
          className="text-sm font-semibold tabular-nums px-5 py-2.5 rounded-2xl"
          style={{ background: "var(--glass)", color: "var(--text-secondary)", border: "1px solid var(--border-subtle)", boxShadow: "var(--shadow-soft)" }}
        >
          {time}
        </span>
      </div>

      {alertMsg && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-4 px-4 rounded-2xl font-semibold mb-6 text-white"
          style={{
            background: "var(--danger)",
            boxShadow: "0 0 28px -4px rgba(220, 38, 38, 0.5)",
          }}
        >
          {alertMsg}
        </motion.div>
      )}

      <motion.div
        layout
        className="card-solid overflow-hidden rounded-3xl flex flex-col items-center justify-center min-h-[380px] sm:min-h-[420px] relative"
        style={{
          boxShadow: hasDanger ? "var(--shadow-glow)" : "var(--shadow-card)",
          borderColor: hasDanger ? "var(--danger)" : "var(--border-subtle)",
          borderWidth: "2px",
        }}
      >
        {isMonitoring && stream ? (
          <>
            <div className="absolute inset-2 rounded-2xl overflow-hidden ring-2 ring-white/10" style={{ boxShadow: "inset 0 0 0 1px var(--border-subtle)" }}>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full min-h-[320px] object-contain bg-black"
              />
            </div>
            <canvas ref={canvasRef} className="hidden" />
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
            <motion.div
              animate={{ opacity: [0.6, 1, 0.6] }}
              transition={{ duration: 2.5, repeat: Infinity }}
              className="w-20 h-20 rounded-2xl flex items-center justify-center text-5xl mb-6"
              style={{ background: "var(--glass)", border: "1px solid var(--border-subtle)", boxShadow: "var(--shadow-soft)" }}
            >
              👁️
            </motion.div>
            <p className="font-bold text-lg mb-1" style={{ color: "var(--text-primary)" }}>
              Camera Preview
            </p>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              Press Start to begin monitoring
            </p>
          </div>
        )}
      </motion.div>

      {error && (
        <p className="mt-4 text-sm text-center" style={{ color: "var(--danger)" }}>{error}</p>
      )}
      {apiError && (
        <p className="mt-2 text-sm text-center" style={{ color: "var(--warning)" }}>
          API: {apiError}
        </p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
        <StatusCard
          icon="👁️"
          label="Eye Status"
          value={eyeStatus}
          status={eyeStatus === "Closed" ? "danger" : "safe"}
        />
        <StatusCard
          icon="➡️"
          label="Face Direction"
          value={faceDirection}
          status={alertMsg ? "danger" : (faceDirection !== "Forward" && faceDirection !== "—") ? "warning" : "safe"}
        />
        <StatusCard
          icon="🥱"
          label="Yawning"
          value={yawnStatus}
          status={yawnStatus === "Yawning" ? "danger" : "safe"}
          extra={`MAR: ${marVal} EAR: ${earVal}`}
        />
      </div>

      <div className="mt-8 flex gap-4">
        {!isMonitoring ? (
          <motion.button
            type="button"
            onClick={startMonitoring}
            className="btn-primary flex-1 py-4 rounded-2xl text-lg font-semibold"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Start Monitoring
          </motion.button>
        ) : (
          <motion.button
            type="button"
            onClick={handleStop}
            className="w-full py-4 rounded-2xl text-lg font-semibold text-white transition-all active:scale-[0.98]"
            style={{ background: "var(--danger)" }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Stop Monitoring
          </motion.button>
        )}
      </div>

      <div className="mt-8 flex flex-wrap justify-center gap-6 text-sm">
        <Link to="/alerts">
          <motion.span className="font-semibold hover:underline inline-block" style={{ color: "var(--primary)" }} whileHover={{ y: -1 }} whileTap={{ scale: 0.98 }}>
            View Alerts & History
          </motion.span>
        </Link>
        <Link to="/dashboard">
          <motion.span className="font-semibold hover:underline inline-block" style={{ color: "var(--primary)" }} whileHover={{ y: -1 }} whileTap={{ scale: 0.98 }}>
            Dashboard
          </motion.span>
        </Link>
      </div>
    </div>
  );
}

function StatusCard({ icon, label, value, status, extra }) {
  const statusClass =
    status === "danger" ? "state-danger" : status === "warning" ? "state-warning" : "state-safe";
  const iconCircleClass =
    status === "danger" ? "icon-circle-danger" : status === "warning" ? "icon-circle-warning" : "icon-circle-safe";
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.25 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="card-solid py-6 px-5 flex flex-col items-center rounded-2xl"
      style={{ boxShadow: "var(--shadow-soft)" }}
    >
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl mb-3 ${iconCircleClass}`}>
        {icon}
      </div>
      <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>
        {label}
      </p>
      <p className={`text-base font-bold mt-1 ${statusClass}`}>
        {value}
      </p>
      {extra && <p className="text-xs mt-2 opacity-80" style={{ color: "var(--text-muted)" }}>{extra}</p>}
    </motion.div>
  );
}