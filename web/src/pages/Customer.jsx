// src/pages/Customer.jsx

import React, { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { io } from "socket.io-client";
import { useTranslation } from "react-i18next";

// 🔧 adjust these imports to match your project
import api from "../lib/api";
import { getGlobalErrorFromAxios } from "../lib/errorHelpers";
import { useToast } from "../components/ToastProvider";
import LanguageSwitcher from "../components/LanguageSwitcher.jsx";
import LoadingSpinner from "../components/LoadingSpinner";

// Lottie (core, no React wrapper)
import lottie from "lottie-web";
// JSON animations
import pendingAnim from "../lotties/status-pending.json";
import readyAnim from "../lotties/status-ready.json";
import doneAnim from "../lotties/status-done.json";

const SOCKET_URL = import.meta.env.VITE_REALTIME_URL || "http://localhost:4000";
const SOUND_MUTED_KEY = "vp_customer_sound_muted";

// Lottie status animation on top of the card
function StatusAnimation({ status, label }) {
  const { t } = useTranslation("customer"); // namespace: "customer"
  const containerRef = useRef(null);
  const animRef = useRef(null);

  // Map order status → animation JSON
  const animationMap = {
    pending: pendingAnim,
    ready: readyAnim,
    done: doneAnim,
  };
  const animationData = animationMap[status] || pendingAnim;

  useEffect(() => {
    if (!containerRef.current) return;

    // Destroy any previous instance
    if (animRef.current) {
      animRef.current.destroy();
      animRef.current = null;
    }

    animRef.current = lottie.loadAnimation({
      container: containerRef.current,
      renderer: "svg",
      loop: true,
      autoplay: true,
      animationData,
    });

    return () => {
      if (animRef.current) {
        animRef.current.destroy();
        animRef.current = null;
      }
    };
  }, [animationData]);

  return (
    <div
      className={`w-full rounded-2xl px-3 py-2.5 sm:px-4 sm:py-3 mb-3 flex items-center gap-3`}
    >
      <div className="flex items-center gap-3 flex-1 min-w-0 justify-center">
        <div ref={containerRef} className="h-32 w-32 flex-shrink-0" />
      </div>
    </div>
  );
}

export default function Customer() {
  const { t } = useTranslation("customer");
  const { publicCode } = useParams();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState(null);
  const [shop, setShop] = useState(null);
  const [error, setError] = useState(null);

  const [isMuted, setIsMuted] = useState(false);
  const [isSocketConnected, setIsSocketConnected] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);

  const audioRef = useRef(null);
  const socketRef = useRef(null);

  // Load sound preference once
  useEffect(() => {
    const stored = localStorage.getItem(SOUND_MUTED_KEY);
    if (stored === "true") {
      setIsMuted(true);
    }
  }, []);

  // Fetch order + shop info using shared api + toast pattern
  useEffect(() => {
    if (!publicCode) return;

    let isMounted = true;

    async function loadOrder() {
      setLoading(true);
      setError(null);

      try {
        const res = await api.get(`/customer/orders/${publicCode}`);
        const data = res.data?.data ?? {};
        if (!isMounted) return;

        setOrder(data.order || null);
        setShop(data.shop || data.order?.shop || null);
      } catch (err) {
        if (!isMounted) return;

        console.error("Failed to fetch order", err);

        if (err?.response?.status === 404) {
          setOrder(null);
          setError(t("errors.order_not_found"));
          return;
        }

        setError(t("errors.failed_to_load_order"));
        showToast({
          type: "error",
          message: getGlobalErrorFromAxios(err, t),
        });
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadOrder();

    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [publicCode]);

  // Setup socket connection once we know the order id
  useEffect(() => {
    if (!order?.id) return;

    const socket = io(SOCKET_URL, {
      transports: ["websocket"],
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      setIsSocketConnected(true);
      socket.emit("join_order_room", { order_id: order.id });
    });

    socket.on("order_status_updated", (payload) => {
      if (payload.order_id === order.id) {
        setOrder((prev) => (prev ? { ...prev, status: payload.status } : prev));
      }
    });

    socket.on("disconnect", () => {
      setIsSocketConnected(false);
    });

    return () => {
      try {
        socket.emit("leave_order_room", { order_id: order.id });
      } catch (e) {
        // ignore
      }
      socket.disconnect();
      socketRef.current = null;
    };
  }, [order?.id]);

  // Handle sound playback when status changes
  useEffect(() => {
    const audioEl = audioRef.current;
    if (!audioEl || !order) return;

    const shouldPlay = order.status === "ready" && !isMuted && hasInteracted;

    if (shouldPlay) {
      audioEl.loop = true;
      const playPromise = audioEl.play();
      if (playPromise && typeof playPromise.catch === "function") {
        playPromise.catch((err) => {
          console.warn("Audio autoplay blocked:", err);
        });
      }
    } else {
      audioEl.pause();
      audioEl.currentTime = 0;
    }
  }, [order?.status, isMuted, hasInteracted]);

  const toggleMute = () => {
    setHasInteracted(true);

    setIsMuted((prev) => {
      const next = !prev;
      localStorage.setItem(SOUND_MUTED_KEY, next ? "true" : "false");
      return next;
    });
  };

  const getStatusLabel = (status) => {
    if (!status) return "-";
    return t(`status.${status}`, status);
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case "pending":
        return "bg-gray-100 text-gray-800";
      case "ready":
        return "bg-green-100 text-green-800";
      case "done":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getCardClassNames = (status) => {
    switch (status) {
      case "pending":
        return "bg-white border-slate-200";
      case "ready":
        return "bg-emerald-50 border-emerald-200";
      case "done":
        return "bg-blue-50 border-blue-200";
      default:
        return "bg-white border-slate-100";
    }
  };

  // Loading state
  if (loading) {
    return <LoadingSpinner message={t("loading_order")} />;
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <div className="bg-white shadow-lg rounded-2xl px-6 py-6 max-w-md w-full">
          <p className="text-red-600 font-semibold mb-2 text-center">
            {t("errors.title")}
          </p>
          <p className="text-slate-700 mb-4 text-sm text-center">{error}</p>
          <p className="text-xs text-slate-400 text-center">
            {t("errors.help_text")}
          </p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <div className="bg-white shadow-lg rounded-2xl px-6 py-6 max-w-md w-full text-center">
          <p className="text-slate-800 font-semibold mb-2">
            {t("errors.order_not_found")}
          </p>
          <p className="text-xs text-slate-500">{t("errors.check_code")}</p>
        </div>
      </div>
    );
  }

  const statusLabel = getStatusLabel(order.status);

  return (
    <div
      className="min-h-screen bg-slate-50 flex flex-col"
      onClick={() => setHasInteracted(true)}
    >
      {/* Hidden audio tag; src from shop sound if available */}
      <audio
        ref={audioRef}
        src={shop?.sound_url || "/sounds/happy-bell.wav"}
        preload="auto"
      />

      {/* Header: Shop info */}
      <header className="border-b bg-white/90 backdrop-blur">
        <div className="max-w-xl mx-auto px-4 py-3 flex items-center gap-3">
          {shop?.logo_url && (
            <img
              src={shop.logo_url}
              alt={shop.name}
              className="h-9 w-9 sm:h-10 sm:w-10 rounded-full object-cover border border-slate-200"
            />
          )}
          <div className="flex-1 min-w-0">
            <p className="text-[11px] uppercase tracking-wide text-slate-400">
              {t("shop")}
            </p>
            <h1 className="text-base sm:text-lg font-semibold text-slate-900 truncate">
              {shop?.name || t("shop_fallback")}
            </h1>
            <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5">
              {t("order_for_you")}
            </p>
          </div>

          {/* Mute toggle */}
          <button
            type="button"
            onClick={toggleMute}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 sm:px-3 rounded-full border text-[11px] sm:text-xs font-medium 
                       border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <span
              className={`h-2 w-2 rounded-full ${
                isMuted ? "bg-slate-400" : "bg-emerald-500"
              }`}
            />
            {isMuted ? t("sound_muted") : t("sound_on")}
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 flex items-center px-4 py-6">
        <div className="max-w-xl mx-auto w-full">
          {/* Single card wrapping everything for a cleaner look */}
          <div
            className={`rounded-2xl shadow-md p-4 sm:p-5 space-y-4 border ${getCardClassNames(
              order.status
            )}`}
          >
            {/* 🔔 Status animation banner on top of the card */}
            <StatusAnimation status={order.status} label={statusLabel} />

            {/* Order basic info */}
            <section className="rounded-xl bg-slate-50/70 p-3 sm:p-4">
              <div className="flex flex-row justify-between gap-3 mb-2">
                <div>
                  <p className="text-[11px] text-slate-400 uppercase tracking-wide">
                    {t("your_order")}
                  </p>
                  <p className="text-sm sm:text-base font-semibold text-slate-900">
                    {t("order_no", { orderNo: order.order_no || "-" })}
                  </p>
                </div>
                <div className="text-left sm:text-right justify-items-center">
                  <p className="text-[11px] text-slate-400 mb-1">
                    {t("status")}
                  </p>
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-[11px] sm:text-xs font-medium uppercase ${getStatusBadgeClass(
                      order.status
                    )}`}
                  >
                    {statusLabel}
                    {isSocketConnected && (
                      <span className="ml-2 inline-block h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    )}
                  </span>
                </div>
              </div>

              {/* Status explanation / hint */}
              <div className="mt-1 text-[11px] sm:text-xs text-slate-500">
                {order.status === "ready"
                  ? t("status_hint.ready")
                  : order.status === "done"
                  ? t("status_hint.done")
                  : t("status_hint.default")}
              </div>
            </section>

            {/* Items list */}
            <section>
              <p className="text-[11px] sm:text-xs text-slate-400 uppercase tracking-wide mb-2">
                {t("items")}
              </p>

              {(!order.items || order.items.length === 0) && (
                <p className="text-sm text-slate-500">{t("no_items")}</p>
              )}

              {order.items && order.items.length > 0 && (
                <div className="mt-2 space-y-1">
                  {order.items.map((it, idx) => {
                    const qty = it.qty ?? 1;
                    const name = it.name || t("order_item_unnamed") || "Item";
                    const note = it.note?.trim();

                    return (
                      <div
                        key={idx}
                        className="flex items-center gap-2 rounded-md bg-white px-2 py-1"
                      >
                        {/* Qty pill */}
                        <span className="mt-0.5 inline-flex h-5 min-w-[2rem] items-center justify-center rounded-full bg-gray-100 text-[10px] font-semibold text-gray-800">
                          {qty}×
                        </span>

                        {/* Name + note chip */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1">
                            <span className="truncate text-[11px] font-semibold text-gray-900">
                              {name}
                            </span>
                          </div>
                          {note && (
                            <div className="mt-0.5 inline-flex max-w-full items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] text-amber-700">
                              <span className="text-[9px]">●</span>
                              <span className="truncate">{note}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Total (optional if your API provides it) */}
              {typeof order.total_amount === "number" && (
                <div className="mt-3 flex items-center justify-between text-sm sm:text-base">
                  <p className="text-xs text-slate-500">{t("total")}</p>
                  <p className="text-sm sm:text-base font-semibold text-slate-900">
                    {order.total_amount.toLocaleString()} {t("currency")}
                  </p>
                </div>
              )}
            </section>

            {/* Footer note */}
            <section className="pt-1 border-t border-dashed border-slate-200 mt-2">
              <p className="text-[11px] sm:text-xs text-slate-400 text-center">
                {t("footer_note")}
              </p>
            </section>
          </div>
        </div>
      </main>

      <div className="flex flex-col items-end p-4">
        <LanguageSwitcher />
      </div>
    </div>
  );
}
