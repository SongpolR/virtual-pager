import React, { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { io } from "socket.io-client";

const RT = import.meta.env.VITE_REALTIME_URL || "http://localhost:4000";
const API = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

export default function Customer() {
  const { orderNo } = useParams();
  const [status, setStatus] = useState("PREPARING");
  const [joined, setJoined] = useState(false);
  const audioRef = useRef(null);

  // apply UI + sound for a given status
  const applyStatus = async (next) => {
    setStatus(next);
    if (next === "READY") {
      try {
        await audioRef.current?.play();
      } catch (e) {
        // autoplay might be blocked on some browsers; show a hint
        console.debug("Autoplay blocked; waiting for user gesture");
      }
      navigator.vibrate?.([300, 150, 300, 150, 300]);
    }
    if (next === "DONE") {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    }
  };

  useEffect(() => {
    document.title = `Order #${orderNo}`;
  }, [orderNo]);

  // 1) Fetch current status on first load (handles refresh)
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await fetch(`${API}/orders/${encodeURIComponent(orderNo)}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        await applyStatus(data.status);
      } catch (err) {
        console.error("Failed to fetch order status:", err);
      }
    };
    fetchStatus();

    // (optional) lightweight polling safety net every 30s
    const t = setInterval(fetchStatus, 30000);
    return () => clearInterval(t);
  }, [orderNo]);

  // 2) Keep realtime subscription for live changes
  useEffect(() => {
    const socket = io(RT, { transports: ["websocket"] });
    socket.on("connect", () => {
      socket.emit("join-order", orderNo);
      setJoined(true);
    });
    socket.on("order:status", (msg) => {
      if (msg.orderNo !== orderNo) return;
      applyStatus(msg.status);
    });
    return () => {
      socket.emit("leave-order", orderNo);
      socket.disconnect();
    };
  }, [orderNo]);

  // 3) Fallback button if autoplay was blocked
  const enableSound = () => {
    audioRef.current?.play().catch(() => {});
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-gradient-to-b from-white to-gray-50">
      <audio ref={audioRef} src="/ding.wav" loop />
      <div className="max-w-md w-full bg-white rounded-2xl shadow p-8 text-center">
        <h1 className="text-2xl font-semibold">☕ XOLA Café</h1>
        <div className="mt-2 text-gray-500">
          Order <span className="font-semibold">#{orderNo}</span>
        </div>

        {status === "PREPARING" && (
          <div className="mt-6 text-xl">⏳ Preparing your order…</div>
        )}
        {status === "READY" && (
          <div className="mt-6 text-2xl">✅ Your order is ready!</div>
        )}
        {status === "DONE" && (
          <div className="mt-6 text-xl">🧾 Collected. Thank you!</div>
        )}

        {!joined && (
          <div className="mt-6 text-sm text-gray-400">Connecting…</div>
        )}

        <div className="mt-8 text-sm text-gray-500">
          Please keep this page open. Your phone will ring when ready.
        </div>

        {/* Show the button only if we suspect autoplay was blocked */}
        {status === "READY" && (
          <button
            onClick={enableSound}
            className="mt-4 inline-flex items-center px-3 py-2 rounded-lg bg-amber-600 text-white hover:bg-amber-700"
          >
            🔊 Enable sound (if muted)
          </button>
        )}
      </div>
    </div>
  );
}
