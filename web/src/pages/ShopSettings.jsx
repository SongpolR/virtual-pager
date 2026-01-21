// web/src/pages/ShopSettings.jsx
import React, { useCallback, useEffect, useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import api from "../lib/api";
import {
  mapFieldValidationErrors,
  getGlobalErrorFromAxios,
} from "../lib/errorHelpers";
import EditIcon from "../components/icons/EditIcon.jsx";
import CancelIcon from "../components/icons/CancelIcon.jsx";
import { useToast } from "../components/ToastProvider.jsx";
import LoadingSpinner from "../components/LoadingSpinner.jsx";
import ConfirmModal from "../components/ConfirmModal";
import CopyIcon from "../components/icons/CopyIcon.jsx";

const ALLOWED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/jpg"];
const MAX_BYTES = 2 * 1024 * 1024;
const MAX_W = 1024;
const MAX_H = 1024;

const SOUND_KEYS = [
  "arcade",
  "fairy",
  "flute",
  "game",
  "happy-bell",
  "marimba",
  "slot-machine",
  "toy-telephone",
  "urgent",
];

const TIMEZONES = [
  "Asia/Bangkok",
  "Asia/Singapore",
  "Asia/Tokyo",
  "Europe/London",
  "America/New_York",
];

export default function ShopSettings() {
  const { t } = useTranslation(["shop_settings"]);
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);

  const [shop, setShop] = useState(null);
  const [shopName, setShopName] = useState("");
  const [shopFieldErrors, setShopFieldErrors] = useState({});
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [logoMeta, setLogoMeta] = useState({ w: null, h: null, error: "" });
  const logoInputRef = useRef(null);
  const [soundKey, setSoundKey] = useState(SOUND_KEYS[4]);
  const soundRef = useRef(null);
  const [timezone, setTimezone] = useState(TIMEZONES[0]);
  const [savingShop, setSavingShop] = useState(false);

  const [inviteName, setInviteName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteFieldErrors, setInviteFieldErrors] = useState({});
  const [inviting, setInviting] = useState(false);

  const [staffs, setStaffs] = useState([]);
  const [confirmStaffAction, setConfirmStaffAction] = useState(null);

  // const openStaffConfirm = (action, id) =>
  //   setConfirmStaffAction({ action, id });
  // const closeStaffConfirm = () => setConfirmStaffAction(null);

  const fetchShop = useCallback(async () => {
    const shopRes = await api.get("/shop");
    const s = shopRes.data?.data?.shop ?? shopRes.data;
    setShop(s);
    setShopName(s?.name || "");
    setLogoPreview(s?.logo_url || null);
    setSoundKey(s?.sound_key || SOUND_KEYS[0]);
    setTimezone(
      s?.timezone ||
        Intl.DateTimeFormat().resolvedOptions().timeZone ||
        TIMEZONES[0]
    );
  }, []);

  // replace confirmStaffAction usage with these:
  const [confirmCtx, setConfirmCtx] = useState(null); // { action, id }
  const [confirmOpen, setConfirmOpen] = useState(false);

  const openStaffConfirm = (action, id) => {
    setConfirmCtx({ action, id });
    setConfirmOpen(true);
  };

  const closeStaffConfirm = () => {
    setConfirmOpen(false);
  };

  // after closing, clear context AFTER exit animation finishes
  useEffect(() => {
    if (confirmOpen) return;
    if (!confirmCtx) return;

    const t = setTimeout(() => setConfirmCtx(null), 220); // must match Dialog duration
    return () => clearTimeout(t);
  }, [confirmOpen, confirmCtx]);

  const fetchStaffs = useCallback(async () => {
    const staffRes = await api.get("/staff");
    setStaffs(staffRes.data?.data?.staffs ?? []);
  }, []);

  // Initial load
  useEffect(() => {
    const fetchAll = async () => {
      try {
        await Promise.all([fetchShop(), fetchStaffs()]);
      } catch (err) {
        showToast({ type: "error", message: getGlobalErrorFromAxios(err, t) });
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [fetchShop, fetchStaffs, showToast, t]);

  const updateShopName = (value) => {
    setShopName(value);
    setShopFieldErrors((prev) => {
      if (!prev.name) return prev;
      const next = { ...prev };
      delete next.name;
      return next;
    });
  };

  const handleLogoClick = () => {
    if (logoInputRef.current) {
      logoInputRef.current.click();
    }
  };

  const handleLogoChange = (file) => {
    // If no file (e.g. user cancelled dialog), do nothing
    if (!file) return;

    setLogoFile(file);
    setLogoMeta({ w: null, h: null, error: "" });
    setShopFieldErrors((prev) => {
      if (!prev.logo) return prev;
      const next = { ...prev };
      delete next.logo;
      return next;
    });

    // Basic type/size checks
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      const msg = t("common:errors.1007");
      setLogoMeta({ w: null, h: null, error: msg });
      setShopFieldErrors((prev) => ({ ...prev, logo: msg }));
      setLogoPreview(null);
      return;
    }
    if (file.size > MAX_BYTES) {
      const msg = t("common:errors.1008");
      setLogoMeta({ w: null, h: null, error: msg });
      setShopFieldErrors((prev) => ({ ...prev, logo: msg }));
      setLogoPreview(null);
      return;
    }

    const url = URL.createObjectURL(file);
    setLogoPreview(url);

    const img = new Image();
    img.onload = () => {
      const w = img.naturalWidth;
      const h = img.naturalHeight;
      if (w > MAX_W || h > MAX_H) {
        const msg = t("common:errors.1009");
        setLogoMeta({ w, h, error: msg });
        setShopFieldErrors((prev) => ({ ...prev, logo: msg }));
      } else {
        setLogoMeta({ w, h, error: "" });
      }
      URL.revokeObjectURL(url);
    };
    img.onerror = () => {
      const msg = t("common:errors.1007");
      setLogoMeta({ w: null, h: null, error: msg });
      setShopFieldErrors((prev) => ({ ...prev, logo: msg }));
      URL.revokeObjectURL(url);
    };
    img.src = url;
  };

  const handleLogoClear = () => {
    // Clear selected file and meta, restore original logo from shop
    setLogoFile(null);
    setLogoMeta({ w: null, h: null, error: "" });
    setLogoPreview(shop?.logo_url || null);
    setShopFieldErrors((prev) => {
      if (!prev.logo) return prev;
      const next = { ...prev };
      delete next.logo;
      return next;
    });
  };

  const playSoundPreview = (key) => {
    try {
      // Stop previous sound if still playing
      if (soundRef.current) {
        soundRef.current.pause();
        soundRef.current.currentTime = 0;
      }

      // Create new audio instance
      const audio = new Audio(`/sounds/${key}.wav`);
      soundRef.current = audio;

      audio.play().catch(() => {
        // Autoplay error ignored
      });
    } catch {
      // ignore
    }
  };

  const getBaseTimezone = () =>
    shop?.timezone ||
    Intl.DateTimeFormat().resolvedOptions().timeZone ||
    "Asia/Bangkok";

  const isShopDirty = () => {
    if (!shop) return false;

    const baseName = (shop.name || "").trim();
    const currentName = (shopName || "").trim();

    const baseSound = shop.sound_key || "ding";
    const baseTimezone = getBaseTimezone();

    return (
      currentName !== baseName ||
      !!logoFile || // any new logo selected
      soundKey !== baseSound ||
      timezone !== baseTimezone
    );
  };

  const saveShop = async () => {
    if (!isShopDirty()) return;

    setSavingShop(true);
    setShopFieldErrors({});

    const trimmedName = shopName.trim();

    if (!trimmedName) {
      const msg = t("common:errors.1001");
      setShopFieldErrors({ name: msg });
      setSavingShop(false);
      return;
    }

    if (logoMeta.error) {
      setShopFieldErrors((prev) => ({ ...prev, logo: logoMeta.error }));
      setSavingShop(false);
      return;
    }

    try {
      const fd = new FormData();
      fd.append("name", trimmedName);
      fd.append("sound_key", soundKey);
      fd.append("timezone", timezone);
      if (logoFile) {
        fd.append("logo", logoFile);
      }

      const res = await api.post("/shop", fd, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      const data = res.data;

      if (data?.success) {
        const updated = data.data?.shop ?? data.data ?? shop ?? {};
        const updatedShop = {
          ...updated,
          name: updated.name ?? trimmedName,
          logo_url: updated.logo_url ?? shop?.logo_url ?? null,
          sound_key: updated.sound_key ?? soundKey,
          timezone:
            updated.timezone ??
            timezone ??
            Intl.DateTimeFormat().resolvedOptions().timeZone,
        };

        setShop(updatedShop);
        setShopName(updatedShop.name || trimmedName);
        setLogoPreview(updatedShop.logo_url || logoPreview);
        setLogoFile(null);
        setLogoMeta({ w: null, h: null, error: "" });
        setSoundKey(updatedShop.sound_key || "happy-bell");
        setTimezone(
          updatedShop.timezone ||
            Intl.DateTimeFormat().resolvedOptions().timeZone ||
            "Asia/Bangkok"
        );

        showToast({ type: "success", message: t("shop_saved") });
        setSavingShop(false);
        return;
      }
    } catch (err) {
      if (!err.response) {
        showToast({ type: "error", message: getGlobalErrorFromAxios(err, t) });
        setSavingShop(false);
        return;
      }

      const { status, data } = err.response;

      // Validation errors from backend (422)
      if (status === 422 && data?.errors && typeof data.errors === "object") {
        const fe = mapFieldValidationErrors(data.errors, t);
        setShopFieldErrors(fe);
        setSavingShop(false);
        return;
      }

      if (data?.message) {
        showToast({ type: "error", message: data?.mesaage });
      } else {
        showToast({ type: "error", message: getGlobalErrorFromAxios(err, t) });
      }
    } finally {
      setSavingShop(false);
    }
  };

  // ---- Invite Staff helpers ----
  const updateInviteName = (value) => {
    setInviteName(value);
    setInviteFieldErrors((prev) => {
      if (!prev.name) return prev;
      const next = { ...prev };
      delete next.name;
      return next;
    });
  };

  const updateInviteEmail = (value) => {
    setInviteEmail(value);
    setInviteFieldErrors((prev) => {
      if (!prev.email) return prev;
      const next = { ...prev };
      delete next.email;
      return next;
    });
  };

  const handleInviteSubmit = async (e) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;

    setInviteFieldErrors({});
    setInviting(true);

    try {
      const res = await api.post("/staff/invite", {
        email: inviteEmail.trim(),
        name: inviteName.trim() || null,
      });

      const data = res.data;

      if (data?.success) {
        if (data.message === "STAFF_ALREADY_EXISTS") {
          showToast({ type: "warning", message: t("staff_already_exists") });
        } else {
          showToast({ type: "success", message: t("invite_sent") });
        }
        setInviteEmail("");
        setInviteName("");
        setInviting(false);
        return;
      }
    } catch (err) {
      if (!err.response) {
        showToast({ type: "error", message: getGlobalErrorFromAxios(err, t) });
        setInviting(false);
        return;
      }

      const { status, data } = err.response;

      if (status === 422 && data?.errors && typeof data.errors === "object") {
        const fe = mapFieldValidationErrors(data.errors, t);
        setInviteFieldErrors(fe);

        const globalMsg = getGlobalErrorFromAxios(err, t, {
          defaultValidationCode: 1000,
        });
        showToast({ type: "error", message: globalMsg });
        setInviting(false);
        return;
      }

      if (data?.message) {
        showToast({ type: "error", message: data?.message });
      } else {
        showToast({ type: "error", message: getGlobalErrorFromAxios(err, t) });
      }
    } finally {
      await fetchStaffs();
      setInviting(false);
    }
  };

  const resendInvite = async (email) => {
    try {
      const res = await api.post("/staff/invite/resend", { email });
      const data = res.data;

      if (data?.success) {
        showToast({ type: "success", message: t("invite_resent") });
        return;
      }
    } catch (err) {
      showToast({ type: "error", message: getGlobalErrorFromAxios(err, t) });
    }
  };

  const resetStaffPassword = async (email) => {
    try {
      const res = await api.post("/staff/forgot", { email });
      const data = res.data;

      if (data?.success) {
        showToast({ type: "success", message: t("auth:reset_link_sent") });
        return;
      }
    } catch (err) {
      showToast({ type: "error", message: getGlobalErrorFromAxios(err, t) });
    }
  };

  const activateStaff = async (id, opts = {}) => {
    if (!opts.skipConfirm) {
      openStaffConfirm("activate", id);
      return;
    }

    try {
      const res = await api.post(`/staff/${staffId}/activate`);
      const data = res.data;

      if (data?.success) {
        setStaffs((prev) =>
          prev.map((s) =>
            s.kind === "staff" && s.id === id ? { ...s, is_active: 1 } : s
          )
        );
        showToast({ type: "success", message: t("staff_activated") });
      }
    } catch (err) {
      showToast({ type: "error", message: getGlobalErrorFromAxios(err, t) });
    }
  };

  const deactivateStaff = async (id, opts = {}) => {
    if (!opts.skipConfirm) {
      openStaffConfirm("deactivate", id);
      return;
    }

    const staffId = id.replace("staff:", "");

    try {
      const res = await api.post(`/staff/${staffId}/deactivate`);
      const data = res.data;

      if (data?.success) {
        setStaffs((prev) =>
          prev.map((s) =>
            s.kind === "staff" && s.id === id ? { ...s, is_active: 0 } : s
          )
        );
        showToast({ type: "warning", message: t("staff_deactivated") });
      }
    } catch (err) {
      showToast({ type: "error", message: getGlobalErrorFromAxios(err, t) });
    }
  };

  const removeStaff = async (id, opts = {}) => {
    if (!opts.skipConfirm) {
      openStaffConfirm("remove", id);
      return;
    }

    const staffId = id.replace("staff:", "").replace("invite:", "");

    try {
      const res = await api.post(`/staff/${staffId}/remove`);
      const data = res.data;

      if (data?.success) {
        setStaffs((prev) =>
          prev.map((s) =>
            s.kind === "staff" && s.id === id ? { ...s, is_active: 0 } : s
          )
        );
        showToast({ type: "error", message: t("staff_removed") });
      }
    } catch (err) {
      showToast({ type: "error", message: getGlobalErrorFromAxios(err, t) });
    } finally {
      await fetchStaffs();
    }
  };

  const copyShopCode = async () => {
    if (!shop.code) return;

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shop.code);
      } else {
        // fallback
        const ta = document.createElement("textarea");
        ta.value = shop.code;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }

      showToast({
        type: "success",
        message: t("shop_code_copied") || "Copied",
      });
    } catch (e) {
      showToast({
        type: "error",
        message: t("shop_code_copy_failed") || "Copy failed",
      });
    }
  };

  if (loading) {
    return <LoadingSpinner fullscreen={true} label={t("common:loading")} />;
  }

  return (
    <div className="mt-4 space-y-6 text-slate-900 dark:text-slate-100">
      <ConfirmModal
        open={confirmOpen}
        title={
          confirmCtx?.action === "activate"
            ? t("confirm_activate_title") || "Activate staff?"
            : confirmCtx?.action === "deactivate"
              ? t("confirm_deactivate_title") || "Deactivate staff?"
              : t("confirm_remove_title") || "Remove staff?"
        }
        message={
          confirmCtx?.action === "activate"
            ? t("confirm_activate_message") ||
              "This staff will be able to access orders and update statuses."
            : confirmCtx?.action === "deactivate"
              ? t("confirm_deactivate_message") ||
                "This staff will no longer be able to access the system."
              : t("confirm_remove_message") ||
                "This staff will be removed from this shop."
        }
        cancelLabel={t("common:cancel") || "Cancel"}
        confirmLabel={
          confirmCtx?.action === "activate"
            ? t("auth:activate") || "Activate"
            : confirmCtx?.action === "deactivate"
              ? t("auth:deactivate") || "Deactivate"
              : t("common:remove") || "Remove"
        }
        variant={
          confirmCtx?.action === "activate"
            ? "info"
            : confirmCtx?.action === "deactivate"
              ? "warning"
              : "error"
        }
        onCancel={closeStaffConfirm}
        onConfirm={async () => {
          const ctx = confirmCtx; // snapshot
          closeStaffConfirm();
          if (!ctx) return;

          if (ctx.action === "activate")
            await activateStaff(ctx.id, { skipConfirm: true });
          else if (ctx.action === "deactivate")
            await deactivateStaff(ctx.id, { skipConfirm: true });
          else await removeStaff(ctx.id, { skipConfirm: true });
        }}
      />

      {/* Header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold sm:text-2xl">
            {t("shop_settings_title") || t("owner_dashboard")}
          </h1>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {t("shop_settings_subtitle") ||
              "Configure your shop info, notification sounds, timezone, and staff access."}
          </p>
        </div>
      </div>

      {/* Shop info + editing */}
      {shop && (
        <section className="app-card-surface rounded-2xl border shadow-sm shadow-slate-900/5 dark:shadow-slate-900/40">
          {/* Section header */}
          <div className="border-b border-slate-100 px-4 pb-3 pt-3.5 text-sm font-semibold text-slate-800 dark:border-slate-800 dark:text-slate-100">
            {t("shop_info_title") || t("shop_settings_title")}
          </div>

          <div className="space-y-4 px-4 pb-4 pt-3">
            <div>
              <label className="mb-1 block text-[11px] font-medium text-slate-600 dark:text-slate-300">
                {t("common:shop_code")}
              </label>
              <div className="flex items-center justify-between gap-3 p-3 rounded-lg border border-slate-200 bg-slate-50 text-xs text-slate-700 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-200">
                <div className="rounded-xl bg-slate-50 text-slate-700 dark:bg-slate-900/60 dark:text-slate-200 dark:ring-slate-800">
                  <div className="mt-0.5 text-sm font-semibold text-slate-900 dark:text-slate-50">
                    {shop.code}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={copyShopCode}
                  className="inline-flex shrink-0 items-center gap-1 rounded-full border border-slate-300 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-700 shadow-sm hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                  title={t("common:copy") || "Copy"}
                >
                  <CopyIcon size={14} />
                  <span className="hidden sm:inline">
                    {t("common:copy") || "Copy"}
                  </span>
                </button>
              </div>
              <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                {t("shop_code_hint") ||
                  "This code is used for staff login. You can share it with your staff."}
              </p>
            </div>

            {/* Shop name row */}
            <div>
              <label className="mb-1 block text-[11px] font-medium text-slate-600 dark:text-slate-300">
                {t("shop_name")}
              </label>
              <input
                type="text"
                className={[
                  "w-full rounded-lg border px-3 py-2 text-sm",
                  "bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 focus:ring-offset-slate-100",
                  "dark:bg-slate-900/80 dark:text-slate-100 dark:placeholder:text-slate-500 dark:border-slate-700 dark:focus:ring-offset-slate-900",
                  shopFieldErrors.name ? "border-red-500" : "border-slate-300",
                ].join(" ")}
                value={shopName}
                onChange={(e) => updateShopName(e.target.value)}
              />
              {shopFieldErrors.name && (
                <div className="mt-1 text-xs text-red-500">
                  {shopFieldErrors.name}
                </div>
              )}
            </div>

            {/* Logo row */}
            <div className="flex flex-col gap-4 sm:flex-row">
              {/* Logo card */}
              <div className="flex flex-col items-start gap-2">
                <label className="mb-1 block text-[11px] font-medium text-slate-600 dark:text-slate-300">
                  {t("shop_logo")}
                </label>

                <div className="relative flex h-24 w-24 cursor-pointer items-center justify-center overflow-hidden rounded-2xl border border-dashed border-slate-300 bg-slate-50/80 shadow-sm hover:border-indigo-400 hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-900/70 dark:hover:border-indigo-400 dark:hover:bg-slate-900">
                  {/* Preview */}
                  <div className="h-full w-full" onClick={handleLogoClick}>
                    {logoPreview ? (
                      <img
                        src={logoPreview}
                        alt="shop logo"
                        className="h-full w-full object-contain"
                      />
                    ) : (
                      <span className="flex h-full w-full items-center justify-center text-xs text-slate-400">
                        {t("logo_placeholder") || "Upload logo"}
                      </span>
                    )}
                  </div>

                  {/* Hover overlay: edit + cancel (cancel only when new logo selected) */}
                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-slate-900/40 opacity-0 transition-opacity hover:opacity-100">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={handleLogoClick}
                        className="pointer-events-auto inline-flex items-center justify-center rounded-full bg-white/90 p-1.5 text-slate-800 shadow-sm hover:bg-white"
                        title={t("edit_logo") || "Edit"}
                      >
                        <EditIcon size={14} />
                      </button>

                      {logoFile && (
                        <button
                          type="button"
                          onClick={handleLogoClear}
                          className="pointer-events-auto inline-flex items-center justify-center rounded-full bg-white/90 p-1.5 text-red-600 shadow-sm hover:bg-white"
                          title={t("clear_logo") || "Clear"}
                        >
                          <CancelIcon size={14} />
                        </button>
                      )}
                    </div>
                  </div>

                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/png,image/jpeg"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      handleLogoChange(file || null);
                      e.target.value = "";
                    }}
                  />
                </div>
              </div>

              {/* Logo requirements */}
              <div className="flex-1 text-xs text-slate-500 dark:text-slate-400">
                <div className="font-medium">
                  {t("common:logo_requirements_title")}
                </div>
                <ul className="mt-1 list-disc space-y-0.5 pl-4">
                  <li>{t("common:logo_req_size")}</li>
                  <li>{t("common:logo_req_resolution")}</li>
                  <li>{t("common:logo_req_types")}</li>
                </ul>

                {logoMeta.w && logoMeta.h && !logoMeta.error && (
                  <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                    {t("preview")} ({logoMeta.w}×{logoMeta.h}px)
                  </div>
                )}
                {(logoMeta.error || shopFieldErrors.logo) && (
                  <div className="mt-1 text-xs text-red-500">
                    {shopFieldErrors.logo || logoMeta.error}
                  </div>
                )}
              </div>
            </div>

            {/* Sound key */}
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <div className="sm:flex-1">
                <label className="mb-1 block text-[11px] font-medium text-slate-600 dark:text-slate-300">
                  {t("shop_sound_key")}
                </label>
                <select
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 focus:ring-offset-slate-100 dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-100 dark:focus:ring-offset-slate-900"
                  value={soundKey}
                  onChange={(e) => {
                    const value = e.target.value;
                    setSoundKey(value);
                    playSoundPreview(value); // 🔊 play preview
                  }}
                >
                  {SOUND_KEYS.map((key) => {
                    const labelKey = `sound_options.${key.replace("-", "_")}`;
                    const label = t(labelKey) !== labelKey ? t(labelKey) : key;
                    return (
                      <option key={key} value={key}>
                        {label}
                      </option>
                    );
                  })}
                </select>
              </div>

              <button
                type="button"
                onClick={() => playSoundPreview(soundKey)}
                className="mt-2 inline-flex items-center justify-center rounded-full border border-indigo-300 px-3 py-1.5 text-xs font-medium text-indigo-600 shadow-sm hover:bg-indigo-50 dark:border-indigo-500/70 dark:text-indigo-200 dark:hover:bg-indigo-950/40 sm:mt-6"
              >
                {t("preview_sound") || "Preview sound"}
              </button>
            </div>

            {/* Timezone */}
            <div>
              <label className="mb-1 block text-[11px] font-medium text-slate-600 dark:text-slate-300">
                {t("common:timezone")}
              </label>
              <select
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 focus:ring-offset-slate-100 dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-100 dark:focus:ring-offset-slate-900"
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
              >
                {TIMEZONES.map((tz) => {
                  const key = `timezones.${tz}`;
                  const label = t(key) !== key ? t(key) : tz;
                  return (
                    <option key={tz} value={tz}>
                      {label}
                    </option>
                  );
                })}
              </select>
              <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                {t("timezone_helper") ||
                  "Used for order timestamps and notifications."}
              </p>
            </div>

            {/* Save button */}
            <div className="pt-1">
              <button
                type="button"
                onClick={saveShop}
                disabled={savingShop || !isShopDirty()}
                className="inline-flex items-center gap-2 rounded-full bg-indigo-500 px-4 py-2 text-sm font-medium text-white shadow-md shadow-indigo-500/40 transition hover:-translate-y-[1px] hover:bg-indigo-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300 active:translate-y-0 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {savingShop && (
                  <span className="h-3 w-3 animate-spin rounded-full border-[2px] border-white/40 border-t-white" />
                )}
                <span>{t("save_changes") || t("save")}</span>
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Invite Staff */}
      <section className="app-card-surface rounded-2xl border shadow-sm shadow-slate-900/5 dark:shadow-slate-900/40">
        <div className="border-b border-slate-100 px-4 pb-3 pt-3.5 text-sm font-semibold text-slate-800 dark:border-slate-800 dark:text-slate-100">
          {t("invite_staff")}
        </div>
        <form
          className="flex flex-col gap-3 px-4 pb-4 pt-3 sm:flex-row"
          onSubmit={handleInviteSubmit}
        >
          <div className="flex-1">
            <label className="mb-1 block text-[11px] font-medium text-slate-600 dark:text-slate-300">
              {t("staff_name")}
            </label>
            <input
              type="text"
              className={[
                "w-full rounded-lg border px-3 py-2 text-sm",
                "bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 focus:ring-offset-slate-100",
                "dark:bg-slate-900/80 dark:text-slate-100 dark:placeholder:text-slate-500 dark:border-slate-700 dark:focus:ring-offset-slate-900",
                inviteFieldErrors.name ? "border-red-500" : "border-slate-300",
              ].join(" ")}
              placeholder={t("staff_name")}
              value={inviteName}
              onChange={(e) => updateInviteName(e.target.value)}
            />
            {inviteFieldErrors.name && (
              <div className="mt-1 text-xs text-red-500">
                {inviteFieldErrors.name}
              </div>
            )}
          </div>

          <div className="flex-1">
            <label className="mb-1 block text-[11px] font-medium text-slate-600 dark:text-slate-300">
              {t("staff_email")}
            </label>
            <input
              type="email"
              className={[
                "w-full rounded-lg border px-3 py-2 text-sm",
                "bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 focus:ring-offset-slate-100",
                "dark:bg-slate-900/80 dark:text-slate-100 dark:placeholder:text-slate-500 dark:border-slate-700 dark:focus:ring-offset-slate-900",
                inviteFieldErrors.email ? "border-red-500" : "border-slate-300",
              ].join(" ")}
              placeholder={t("staff_email")}
              value={inviteEmail}
              onChange={(e) => updateInviteEmail(e.target.value)}
              required
            />
            {inviteFieldErrors.email && (
              <div className="mt-1 text-xs text-red-500">
                {inviteFieldErrors.email}
              </div>
            )}
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              disabled={!inviteEmail.trim() || inviting}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-indigo-500 px-4 py-2 text-sm font-medium text-white shadow-md shadow-indigo-500/40 transition hover:-translate-y-[1px] hover:bg-indigo-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300 active:translate-y-0 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
            >
              {inviting && (
                <span className="h-3 w-3 animate-spin rounded-full border-[2px] border-white/40 border-t-white" />
              )}
              <span>{t("send_invite")}</span>
            </button>
          </div>
        </form>
      </section>

      {/* Staff List */}
      <section className="app-card-surface rounded-2xl border shadow-sm shadow-slate-900/5 dark:shadow-slate-900/40">
        <div className="border-b border-slate-100 px-4 pb-3 pt-3.5 text-sm font-semibold text-slate-800 dark:border-slate-800 dark:text-slate-100">
          {t("staff_list")}
        </div>
        <div className="overflow-x-auto px-4 pb-4 pt-3">
          <table className="min-w-full border border-slate-200 text-sm dark:border-slate-700">
            <thead className="bg-slate-50 text-slate-700 dark:bg-slate-900 dark:text-slate-200">
              <tr>
                <th className="border border-slate-200 px-3 py-2 text-left text-xs font-medium uppercase tracking-wide dark:border-slate-700">
                  {t("common:name")}
                </th>
                <th className="border border-slate-200 px-3 py-2 text-left text-xs font-medium uppercase tracking-wide dark:border-slate-700">
                  {t("common:email")}
                </th>
                <th className="border border-slate-200 px-3 py-2 text-center text-xs font-medium uppercase tracking-wide dark:border-slate-700">
                  {t("common:status")}
                </th>
                <th className="border border-slate-200 px-3 py-2 text-center text-xs font-medium uppercase tracking-wide dark:border-slate-700">
                  {t("common:actions")}
                </th>
              </tr>
            </thead>
            <tbody>
              {staffs.map((s, idx) => {
                const isInvite = s.kind === "invite";

                return (
                  <tr
                    key={s.uid}
                    className="odd:bg-white even:bg-slate-50/60 hover:bg-indigo-50/40 dark:odd:bg-slate-900 dark:even:bg-slate-900/70 dark:hover:bg-slate-800"
                  >
                    <td className="border border-slate-200 px-3 py-2 text-sm dark:border-slate-700">
                      {s.name || "-"}
                    </td>
                    <td className="border border-slate-200 px-3 py-2 text-sm dark:border-slate-700">
                      {s.email}
                    </td>

                    <td className="border border-slate-200 px-3 py-2 text-center text-xs dark:border-slate-700">
                      {isInvite ? (
                        <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700 dark:bg-amber-900/40 dark:text-amber-200">
                          {t("staff_status_invited") || t("invited")}
                        </span>
                      ) : s.is_active ? (
                        <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200">
                          {t("common:active")}
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-rose-50 px-2 py-0.5 text-[11px] font-medium text-rose-700 dark:bg-rose-900/40 dark:text-rose-200">
                          {t("common:inactive")}
                        </span>
                      )}
                    </td>

                    <td className="border border-slate-200 px-3 py-2 text-center text-xs dark:border-slate-700">
                      <div className="flex flex-wrap items-center justify-center gap-2">
                        {/* Pending invite → only resend */}
                        {isInvite && (
                          <button
                            onClick={() => resendInvite(s.email)}
                            className="text-[11px] font-medium text-indigo-600 underline underline-offset-2 hover:text-indigo-500 dark:text-indigo-300"
                          >
                            {t("resend_invite")}
                          </button>
                        )}

                        {/* Real staff → reset password / deactivate OR activate */}
                        {!isInvite &&
                          (s.is_active ? (
                            <>
                              <button
                                onClick={() => resetStaffPassword(s.email)}
                                className="text-[11px] font-medium text-sky-600 underline underline-offset-2 hover:text-sky-500 dark:text-sky-300"
                              >
                                {t("auth:reset_password")}
                              </button>

                              <button
                                onClick={() => deactivateStaff(s.uid)}
                                className="text-[11px] font-medium text-amber-600 underline underline-offset-2 hover:text-amber-500 dark:text-amber-300"
                              >
                                {t("auth:deactivate")}
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => activateStaff(s.uid)}
                              className="text-[11px] font-medium text-emerald-600 underline underline-offset-2 hover:text-emerald-500 dark:text-emerald-300"
                            >
                              {t("auth:activate")}
                            </button>
                          ))}
                        <button
                          onClick={() => removeStaff(s.uid)}
                          className="text-[11px] font-medium text-rose-600 underline underline-offset-2 hover:text-rose-500 dark:text-rose-300"
                        >
                          {t("common:remove")}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {staffs.length === 0 && (
                <tr>
                  <td
                    colSpan="4"
                    className="border border-slate-200 px-3 py-4 text-center text-xs text-slate-500 dark:border-slate-700 dark:text-slate-400"
                  >
                    {t("no_staff")}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
