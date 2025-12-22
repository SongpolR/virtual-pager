// src/pages/Customer.jsx
import React, {
  useEffect,
  useRef,
  useState,
  useMemo,
  useCallback,
} from "react";
import { useParams } from "react-router-dom";
import { io } from "socket.io-client";
import { useTranslation } from "react-i18next";

import api from "../lib/api";
import { getGlobalErrorFromAxios } from "../lib/errorHelpers";
import { useToast } from "../components/ToastProvider";
import LanguageSwitcher from "../components/LanguageSwitcher.jsx";
import LoadingSpinner from "../components/LoadingSpinner";

// Lottie (core, no React wrapper)
import lottie from "lottie-web";
import pendingAnim from "../lotties/status-pending.json";
import readyAnim from "../lotties/status-ready.json";
import doneAnim from "../lotties/status-done.json";

import ThemeSwitcher from "../components/ThemeSwitcher.jsx";

const SOCKET_URL = import.meta.env.VITE_REALTIME_URL || "http://localhost:4000";
const SOUND_MUTED_KEY = "vp_customer_sound_muted";

/** ✅ IMPORTANT: keep this OUTSIDE Customer to avoid subtree remount flicker */
function PageShell({ children }) {
  return (
    <div className="min-h-screen app-shell-bg text-slate-900 dark:text-slate-100">
      {children}
    </div>
  );
}

function StatusAnimation({ status }) {
  const containerRef = useRef(null);
  const animRef = useRef(null);

  const animationData = useMemo(() => {
    const map = { pending: pendingAnim, ready: readyAnim, done: doneAnim };
    return map[status] || pendingAnim;
  }, [status]);

  useEffect(() => {
    if (!containerRef.current) return;

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
    <div className="flex items-center justify-center">
      <div
        ref={containerRef}
        className="h-32 w-32 sm:h-36 sm:w-36"
        aria-hidden="true"
      />
    </div>
  );
}

/** Fullscreen overlay to unlock audio */
function AudioUnlockOverlay({
  open,
  title,
  subtitle,
  enableBtn,
  mutedBtn,
  soundTips,
  onEnable,
  onMute,
}) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      role="dialog"
      aria-modal="true"
      onPointerDown={(e) => {
        // Tap anywhere → enable
        e.preventDefault();
        onEnable();
      }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className="relative w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-4 shadow-xl shadow-slate-900/15 dark:border-slate-700 dark:bg-slate-900/85 dark:shadow-slate-900/50"
        onPointerDown={(e) => {
          // Keep tap on modal from propagating to parent (we'll handle via buttons too)
          e.stopPropagation();
        }}
      >
        <div className="flex items-start gap-3">
          <div className="relative h-8 w-16 sm:w-12">
            {/* Pulsing ring behind the icon */}
            <span
              aria-hidden="true"
              className="animate-pulse-ring absolute inset-0 rounded-full border border-indigo-400/60 dark:border-indigo-300/50"
            />
            <img
              src="/app-icon.svg"
              alt="App Icon"
              width={32}
              height={32}
              className="relative h-8 w-8 rounded-full bg-indigo-600 ring-1 ring-slate-200 transition-transform duration-200 group-hover:scale-105 group-active:scale-95 dark:bg-indigo-500 dark:ring-slate-700"
            />
          </div>
          <div className="min-w-0">
            <div className="text-sm font-semibold text-slate-900 dark:text-slate-50">
              {title}
            </div>
            <div className="mt-1 text-xs text-slate-600 dark:text-slate-300">
              {subtitle}
            </div>
          </div>
        </div>

        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={onEnable}
            className={[
              "flex-1 rounded-xl px-3 py-2 text-xs font-semibold",
              "bg-indigo-600 text-white shadow-md shadow-indigo-500/40 hover:bg-indigo-700",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300",
            ].join(" ")}
          >
            {enableBtn}
          </button>

          <button
            type="button"
            onClick={onMute}
            className={[
              "rounded-xl px-3 py-2 text-xs font-semibold",
              "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
              "dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-200 dark:hover:bg-slate-800",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300",
            ].join(" ")}
          >
            {mutedBtn}
          </button>
        </div>

        <div className="mt-3 text-center text-[11px] text-slate-500 dark:text-slate-400">
          {soundTips}
        </div>
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

  // if autoplay is blocked, show overlay
  const [needsAudioUnlock, setNeedsAudioUnlock] = useState(false);

  const audioRef = useRef(null);
  const socketRef = useRef(null);

  // ✅ Build audio src from sound_key (shop can be null initially)
  const soundSrc = useMemo(() => {
    const key = shop?.sound_key || "happy-bell";
    return `/sounds/${key}.wav`;
  }, [shop?.sound_key]);

  // ✅ When src changes (shop arrives / user changes sound), reload audio element
  useEffect(() => {
    const audioEl = audioRef.current;
    if (!audioEl) return;

    audioEl.pause();
    audioEl.currentTime = 0;
    audioEl.load();
  }, [soundSrc]);

  // Load sound preference once
  useEffect(() => {
    const stored = localStorage.getItem(SOUND_MUTED_KEY);
    if (stored === "true") setIsMuted(true);
  }, []);

  // Fetch order + shop
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

        if (err?.response?.status === 404) {
          setOrder(null);
          setError(t("errors.order_not_found"));
          return;
        }

        setError(t("errors.failed_to_load_order"));
        showToast({ type: "error", message: getGlobalErrorFromAxios(err, t) });
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

  // Socket: join room
  useEffect(() => {
    if (!order?.id) return;

    const socket = io(SOCKET_URL, { transports: ["websocket"] });
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
      } catch {
        // ignore
      }
      socket.disconnect();
      socketRef.current = null;
    };
  }, [order?.id]);

  const stopAudio = useCallback(() => {
    const audioEl = audioRef.current;
    if (!audioEl) return;
    audioEl.pause();
    audioEl.currentTime = 0;
  }, []);

  const tryPlayReadyLoop = useCallback(async () => {
    const audioEl = audioRef.current;
    if (!audioEl) return false;

    audioEl.loop = true;

    try {
      await audioEl.play();
      return true;
    } catch {
      return false;
    }
  }, []);

  // ✅ Auto-play logic: attempt when ready, otherwise stop
  useEffect(() => {
    if (!order) return;

    const shouldPlay = order.status === "ready" && !isMuted;

    if (!shouldPlay) {
      setNeedsAudioUnlock(false);
      stopAudio();
      return;
    }

    // Try autoplay immediately
    (async () => {
      const ok = await tryPlayReadyLoop();
      setNeedsAudioUnlock(!ok);
      if (!ok) stopAudio();
    })();
  }, [order?.status, isMuted, stopAudio, tryPlayReadyLoop, order]);

  // Overlay actions
  const enableSoundNow = useCallback(async () => {
    if (isMuted) return;

    const ok = await tryPlayReadyLoop();
    setNeedsAudioUnlock(!ok);
  }, [isMuted, tryPlayReadyLoop]);

  const forceMute = useCallback(() => {
    setNeedsAudioUnlock(false);
    stopAudio();
    setIsMuted(true);
    localStorage.setItem(SOUND_MUTED_KEY, "true");
  }, [stopAudio]);

  const toggleMute = () => {
    setIsMuted((prev) => {
      const next = !prev;
      localStorage.setItem(SOUND_MUTED_KEY, next ? "true" : "false");
      return next;
    });
  };

  const statusLabel = useMemo(() => {
    if (!order?.status) return "-";
    return t(`status_map.${order.status}`, order.status);
  }, [order?.status, t]);

  const statusBadgeClass = (status) => {
    switch (status) {
      case "pending":
        return "bg-slate-500/10 text-slate-700 ring-1 ring-slate-500/20 dark:bg-slate-400/10 dark:text-slate-200 dark:ring-slate-400/20";
      case "ready":
        return "bg-emerald-500/10 text-emerald-700 ring-1 ring-emerald-500/20 dark:bg-emerald-400/10 dark:text-emerald-200 dark:ring-emerald-400/20";
      case "done":
        return "bg-indigo-500/10 text-indigo-700 ring-1 ring-indigo-500/20 dark:bg-indigo-400/10 dark:text-indigo-200 dark:ring-indigo-400/20";
      default:
        return "bg-slate-500/10 text-slate-700 ring-1 ring-slate-500/20 dark:bg-slate-400/10 dark:text-slate-200 dark:ring-slate-400/20";
    }
  };

  const cardTint = (status) => {
    switch (status) {
      case "ready":
        return "ring-1 ring-emerald-500/10";
      case "done":
        return "ring-1 ring-indigo-500/10";
      default:
        return "ring-1 ring-slate-900/5 dark:ring-white/5";
    }
  };

  if (loading) {
    return (
      <PageShell>
        <LoadingSpinner fullscreen={true} label={t("loading_order")} />
      </PageShell>
    );
  }

  // Error state (themed)
  if (error) {
    return (
      <PageShell>
        <header className="border-b border-slate-100 bg-white/80 backdrop-blur dark:border-slate-800 dark:bg-slate-950/60">
          <div className="mx-auto flex max-w-xl items-center justify-between px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-full bg-indigo-500/10 ring-1 ring-indigo-500/20 dark:bg-indigo-400/10 dark:ring-indigo-400/20" />
              <div className="min-w-0">
                <div className="text-xs font-semibold text-slate-800 dark:text-slate-100">
                  {t("shop") || "Virtual Pager"}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  {t("errors.title") || "Something went wrong"}
                </div>
              </div>
            </div>

            <LanguageSwitcher />
          </div>
        </header>

        <main className="mx-auto flex max-w-xl items-center justify-center px-4 py-10">
          <div className="app-card-surface w-full rounded-2xl border p-4 shadow-sm shadow-slate-900/5 dark:shadow-slate-900/40">
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700 dark:border-red-500/40 dark:bg-red-950/40 dark:text-red-100">
              <div className="font-semibold">{t("errors.title")}</div>
              <div className="mt-1 opacity-90">{error}</div>
            </div>

            <div className="mt-3 text-center text-xs text-slate-500 dark:text-slate-400">
              {t("errors.help_text")}
            </div>
          </div>
        </main>
      </PageShell>
    );
  }

  // Not found state (themed)
  if (!order) {
    return (
      <PageShell>
        <header className="border-b border-slate-100 bg-white/80 backdrop-blur dark:border-slate-800 dark:bg-slate-950/60">
          <div className="mx-auto flex max-w-xl items-center justify-between px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-full bg-slate-500/10 ring-1 ring-slate-500/20 dark:bg-slate-400/10 dark:ring-slate-400/20" />
              <div className="min-w-0">
                <div className="text-xs font-semibold text-slate-800 dark:text-slate-100">
                  {t("shop") || "Virtual Pager"}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  {t("errors.order_not_found")}
                </div>
              </div>
            </div>

            <LanguageSwitcher />
          </div>
        </header>

        <main className="mx-auto flex max-w-xl items-center justify-center px-4 py-10">
          <div className="app-card-surface w-full rounded-2xl border p-4 shadow-sm shadow-slate-900/5 dark:shadow-slate-900/40">
            <div className="text-center">
              <div className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                {t("errors.order_not_found")}
              </div>
              <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {t("errors.check_code")}
              </div>
            </div>
          </div>
        </main>
      </PageShell>
    );
  }

  const showUnlockOverlay =
    needsAudioUnlock && !isMuted && order.status === "ready";

  return (
    <PageShell>
      {/* ✅ Fullscreen overlay to guide user to tap once */}
      <AudioUnlockOverlay
        open={showUnlockOverlay}
        title={t("tap_to_enable_sound_title") || "Enable sound alert"}
        subtitle={
          t("tap_to_enable_sound_subtitle") ||
          "Your browser needs one tap to allow sound. Tap anywhere or press Enable sound."
        }
        enableBtn={t("enable_sound") || "Enable sound"}
        mutedBtn={t("continue_muted") || "Continue muted"}
        soundTips={t("sound_tips") || "Tip: You can still mute/unmute later."}
        onEnable={enableSoundNow}
        onMute={forceMute}
      />

      {/* Hidden audio */}
      <audio ref={audioRef} src={soundSrc} preload="auto" />

      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-slate-100 bg-white/80 backdrop-blur dark:border-slate-800 dark:bg-slate-950/60">
        <div className="mx-auto flex max-w-xl items-center gap-3 px-4 py-3">
          {/* Shop avatar */}
          <div className="relative h-10 w-10">
            {/* Pulsing ring behind the icon */}
            <span
              aria-hidden="true"
              className="animate-pulse-ring absolute inset-0 rounded-full border border-indigo-400/60 dark:border-indigo-300/50"
            />
            <img
              src={shop.logo_url}
              alt={shop.name}
              width={32}
              height={32}
              className="relative h-10 w-10 rounded-full bg-indigo-600 ring-1 ring-slate-200 transition-transform duration-200 group-hover:scale-105 group-active:scale-95 dark:bg-indigo-500 dark:ring-slate-700"
            />
          </div>

          <div className="min-w-0 flex-1">
            <div className="text-[11px] font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
              {t("shop")}
            </div>
            <div className="truncate text-sm font-semibold text-slate-900 dark:text-slate-50">
              {shop?.name || t("shop_fallback")}
            </div>
            <div className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
              {t("order_for_you")}
            </div>
          </div>

          {/* Connection dot */}
          <span
            className={[
              "hidden sm:inline-flex items-center gap-2 rounded-full px-3 py-2 text-[11px] font-semibold",
              isSocketConnected
                ? "bg-emerald-500/10 text-emerald-700 ring-1 ring-emerald-500/20 dark:bg-emerald-400/10 dark:text-emerald-200 dark:ring-emerald-400/20"
                : "bg-slate-500/10 text-slate-700 ring-1 ring-slate-500/20 dark:bg-slate-400/10 dark:text-slate-200 dark:ring-slate-400/20",
            ].join(" ")}
          >
            <span
              className={[
                "h-1.5 w-1.5 rounded-full",
                isSocketConnected ? "bg-emerald-500" : "bg-slate-400",
                isSocketConnected ? "animate-pulse" : "",
              ].join(" ")}
            />
            {isSocketConnected
              ? t("common:live") || "Live"
              : t("common:offline") || "Offline"}
          </span>

          {/* Mute */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              toggleMute();
            }}
            className={[
              "inline-flex items-center gap-2 rounded-full px-3 py-2 text-[11px] font-medium",
              "border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300",
              "dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200 dark:hover:bg-slate-800",
            ].join(" ")}
          >
            <span
              className={[
                "h-2 w-2 rounded-full",
                isMuted ? "bg-slate-400" : "bg-emerald-500",
              ].join(" ")}
            />
            {isMuted ? t("sound_muted") : t("sound_on")}
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-xl px-4 py-8">
        <div
          className={[
            "app-card-surface rounded-2xl border p-4 shadow-sm shadow-slate-900/5 dark:shadow-slate-900/40",
            cardTint(order.status),
          ].join(" ")}
        >
          {/* Top: animation + status */}
          <div className="rounded-2xl bg-slate-50/70 p-3 dark:bg-slate-900/60">
            <StatusAnimation status={order.status} />
            <div className="mt-2 flex flex-col items-center justify-center gap-2 text-center">
              <div className="text-[11px] font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                {t("your_order")}
              </div>

              <div className="text-3xl font-extrabold text-slate-900 dark:text-slate-50">
                #{order.order_no || "-"}
              </div>

              <span
                className={[
                  "inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-semibold uppercase",
                  statusBadgeClass(order.status),
                ].join(" ")}
              >
                {statusLabel}
                {isSocketConnected && (
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                )}
              </span>

              <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {order.status === "ready"
                  ? t("status_hint.ready")
                  : order.status === "done"
                  ? t("status_hint.done")
                  : t("status_hint.default")}
              </div>
            </div>
          </div>

          {/* Items */}
          <section className="mt-4">
            <div className="mb-2 text-[11px] font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
              {t("items")}
            </div>

            {!order.items || order.items.length === 0 ? (
              <div className="rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-200">
                {t("no_items")}
              </div>
            ) : (
              <div className="space-y-2">
                {order.items.map((it, idx) => {
                  const qty = it.qty ?? 1;
                  const name = it.name || t("order_item_unnamed") || "Item";
                  const note = it.note?.trim();

                  return (
                    <div
                      key={idx}
                      className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2.5 shadow-sm shadow-slate-900/5 dark:border-slate-700 dark:bg-slate-900/60 dark:shadow-slate-900/40"
                    >
                      <span className="mt-0.5 inline-flex h-6 min-w-[2.25rem] items-center justify-center rounded-full bg-slate-100 text-[11px] font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-100">
                        {qty}×
                      </span>

                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-semibold text-slate-900 dark:text-slate-50">
                          {name}
                        </div>

                        {note && (
                          <div className="mt-1 inline-flex max-w-full items-center gap-2 rounded-full bg-amber-500/10 px-2.5 py-1 text-[11px] text-amber-700 ring-1 ring-amber-500/20 dark:bg-amber-400/10 dark:text-amber-200 dark:ring-amber-400/20">
                            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                            <span className="truncate">{note}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {typeof order.total_amount === "number" && (
              <div className="mt-4 flex items-center justify-between rounded-xl bg-slate-50/70 px-3 py-2 dark:bg-slate-900/60">
                <div className="text-xs font-medium text-slate-600 dark:text-slate-300">
                  {t("total")}
                </div>
                <div className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                  {order.total_amount.toLocaleString()} {t("currency")}
                </div>
              </div>
            )}
          </section>

          {/* Footer note */}
          <div className="mt-5 border-t border-dashed border-slate-200 pt-3 text-center text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
            {t("footer_note")}
          </div>
        </div>

        {/* bottom right language */}
        <div className="mt-4 flex justify-end gap-2">
          <LanguageSwitcher />
          <ThemeSwitcher />
        </div>
      </main>
    </PageShell>
  );
}
