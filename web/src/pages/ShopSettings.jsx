// web/src/pages/ShopSettings.jsx
import React, { useEffect, useState, useRef } from "react";
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
  const { t } = useTranslation();

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

  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);

  // Fetch shop + staff
  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [shopRes, staffRes] = await Promise.all([
          api.get("/shop"),
          api.get("/staff"),
        ]);

        if (shopRes.data) {
          // robust: support both wrapped and plain shop responses
          const s = shopRes.data.data?.shop ?? shopRes.data;
          setShop(s);
          setShopName(s.name || "");
          setLogoPreview(s.logo_url || null);
          setSoundKey(s.sound_key || SOUND_KEYS[0]);
          setTimezone(
            s.timezone ||
              Intl.DateTimeFormat().resolvedOptions().timeZone ||
              TIMEZONES[0]
          );
        }

        if (staffRes.data) setStaffs(staffRes.data);
      } catch (err) {
        showToast({ type: "error", message: getGlobalErrorFromAxios(err, t) });
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [t]);

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
      const msg = t("errors.1007");
      setLogoMeta({ w: null, h: null, error: msg });
      setShopFieldErrors((prev) => ({ ...prev, logo: msg }));
      setLogoPreview(null);
      return;
    }
    if (file.size > MAX_BYTES) {
      const msg = t("errors.1008");
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
        const msg = t("errors.1009");
        setLogoMeta({ w, h, error: msg });
        setShopFieldErrors((prev) => ({ ...prev, logo: msg }));
      } else {
        setLogoMeta({ w, h, error: "" });
      }
      URL.revokeObjectURL(url);
    };
    img.onerror = () => {
      const msg = t("errors.1007");
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
    } catch (e) {
      // Do nothing
    }
  };

  const saveShop = async () => {
    if (!isShopDirty()) return;

    setSavingShop(true);
    setShopFieldErrors({});

    const trimmedName = shopName.trim();

    if (!trimmedName) {
      const msg = t("errors.1001");
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
      console.log(err);
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
          showToast({ type: "success", message: t("staff_already_exists") });
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
        setInviting(false);
        return;
      }

      if (data?.message) {
        showToast({ type: "error", message: data?.message });
      } else {
        showToast({ type: "error", message: getGlobalErrorFromAxios(err, t) });
      }
    } finally {
      setInviting(false);
    }
  };

  const resendInvite = async (email) => {
    try {
      const res = await api.post("/staff/invite/resend", { email });
      const data = res.data;

      console.log(data);

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
        showToast({ type: "success", message: t("reset_link_sent") });
        return;
      }
    } catch (err) {
      showToast({ type: "error", message: getGlobalErrorFromAxios(err, t) });
    }
  };

  const activateStaff = async (id) => {
    if (!confirm(t("confirm_deactivate"))) return;
    try {
      const res = await api.post(`/staff/${id}/activate`);
      const data = res.data;

      if (data?.success) {
        setStaffs((prev) =>
          prev.map((s) =>
            s.kind === "staff" && s.id === id ? { ...s, is_active: 1 } : s
          )
        );
        showToast({ type: "success", message: t("staff_activated") });
        return;
      }
    } catch (err) {
      showToast({ type: "error", message: getGlobalErrorFromAxios(err, t) });
    }
  };

  const deactivateStaff = async (id) => {
    if (!confirm(t("confirm_deactivate"))) return;
    try {
      const res = await api.post(`/staff/${id}/deactivate`);
      const data = res.data;

      if (data?.success) {
        setStaffs((prev) =>
          prev.map((s) =>
            s.kind === "staff" && s.id === id ? { ...s, is_active: 0 } : s
          )
        );
        showToast({ type: "warning", message: t("staff_deactivated") });
        return;
      }
    } catch (err) {
      showToast({ type: "error", message: getGlobalErrorFromAxios(err, t) });
    }
  };

  if (loading) {
    return <LoadingSpinner fullscreen={true} label={t("loading")} />;
  }

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

  return (
    <div className="mt-4">
      <h1 className="text-2xl font-bold">
        {t("shop_settings_title") || t("owner_dashboard")}
      </h1>

      {/* Shop info + editing */}
      {shop && (
        <div className="mt-4 bg-white rounded-xl shadow p-4">
          {/* Shop name row */}
          <div className="mb-4">
            <label className="text-xs font-medium text-gray-500">
              {t("shop_name")}
            </label>

            <div className="flex items-center gap-2 mt-2">
              <div className="flex-1">
                <input
                  type="text"
                  className={`border rounded p-2 ${
                    shopFieldErrors.name ? "border-red-500" : ""
                  }`}
                  value={shopName}
                  onChange={(e) => updateShopName(e.target.value)}
                />

                {shopFieldErrors.name && (
                  <div className="mt-1 text-xs text-red-600">
                    {shopFieldErrors.name}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Logo row */}
          <div className="mt-4">
            <label className="block text-xs font-medium text-gray-500 mb-2">
              {t("shop_logo")}
            </label>

            <div className="relative w-24 h-24 border rounded overflow-hidden flex items-center justify-center bg-gray-50 cursor-pointer">
              {/* Preview */}
              <div className="w-full h-full" onClick={handleLogoClick}>
                {logoPreview ? (
                  <img
                    src={logoPreview}
                    alt="shop logo"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <span className="text-xs text-gray-400 flex items-center justify-center h-full">
                    {"Logo"}
                  </span>
                )}
              </div>

              {/* Hover overlay: edit + cancel (cancel only when new logo selected) */}
              <div className="absolute inset-0 bg-black/30 opacity-0 hover:opacity-100 flex items-center justify-center text-white text-xs transition">
                <button
                  type="button"
                  onClick={handleLogoClick}
                  className="flex items-center gap-1 px-2 py-1 rounded mr-1"
                >
                  <EditIcon size={14} />
                </button>

                {logoFile && (
                  <button
                    type="button"
                    onClick={handleLogoClear}
                    className="flex items-center gap-1 px-2 py-1 rounded ml-1"
                  >
                    <CancelIcon size={14} />
                  </button>
                )}
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

            <div className="flex-1 text-xs text-gray-400 mt-2">
              <div className="font-medium">{t("logo_requirements_title")}</div>
              <ul className="mt-1 list-disc pl-4 space-y-0.5">
                <li>{t("logo_req_size")}</li>
                <li>{t("logo_req_resolution")}</li>
                <li>{t("logo_req_types")}</li>
              </ul>

              {logoMeta.w && logoMeta.h && !logoMeta.error && (
                <div className="mt-1 text-gray-400">
                  {t("preview")} ({logoMeta.w}×{logoMeta.h}px)
                </div>
              )}
              {(logoMeta.error || shopFieldErrors.logo) && (
                <div className="mt-1 text-xs text-red-600">
                  {shopFieldErrors.logo || logoMeta.error}
                </div>
              )}
            </div>
          </div>

          {/* Sound key */}
          <div className="mt-4">
            <label className="block text-xs font-medium text-gray-500 mb-2">
              {t("shop_sound_key")}
            </label>
            <select
              className="border p-2 rounded"
              value={soundKey}
              onChange={(e) => {
                const value = e.target.value;
                setSoundKey(value);
                playSoundPreview(value); // 🔊 play preview
              }}
            >
              {SOUND_KEYS.map((key) => {
                const labelKey = `sound_options.${key}`;
                const label = t(labelKey) !== labelKey ? t(labelKey) : key;
                return (
                  <option key={key} value={key}>
                    {label}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Timezone */}
          <div className="mt-4">
            <label className="block text-xs font-medium text-gray-500 mb-2">
              {t("timezone")}
            </label>
            <select
              className="border p-2 rounded"
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
          </div>

          {/* Save button */}
          <div className="mt-4 flex justify-start">
            <button
              type="button"
              onClick={saveShop}
              disabled={savingShop || !isShopDirty()}
              className="px-4 py-2 bg-black text-white rounded disabled:opacity-50 hover:bg-gray-800"
            >
              {t("save_changes") || t("save")}
            </button>
          </div>
        </div>
      )}

      {/* Invite Staff */}
      <div className="mt-6 bg-white rounded-xl shadow p-4">
        <h2 className="text-lg font-semibold">{t("invite_staff")}</h2>
        <form
          className="mt-3 flex flex-col sm:flex-row gap-3"
          onSubmit={handleInviteSubmit}
        >
          <div className="flex-1">
            <input
              type="text"
              className={`border p-2 rounded w-full ${
                inviteFieldErrors.name ? "border-red-500" : ""
              }`}
              placeholder={t("staff_name")}
              value={inviteName}
              onChange={(e) => updateInviteName(e.target.value)}
            />
            {inviteFieldErrors.name && (
              <div className="mt-1 text-xs text-red-600">
                {inviteFieldErrors.name}
              </div>
            )}
          </div>

          <div className="flex-1">
            <input
              type="email"
              className={`border p-2 rounded w-full ${
                inviteFieldErrors.email ? "border-red-500" : ""
              }`}
              placeholder={t("staff_email")}
              value={inviteEmail}
              onChange={(e) => updateInviteEmail(e.target.value)}
              required
            />
            {inviteFieldErrors.email && (
              <div className="mt-1 text-xs text-red-600">
                {inviteFieldErrors.email}
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={!inviteEmail.trim() || inviting}
            className="bg-black text-white px-4 py-2 rounded hover:bg-gray-800 disabled:opacity-50"
          >
            {t("send_invite")}
          </button>
        </form>
      </div>

      {/* Staff List */}
      <div className="mt-8 bg-white rounded-xl shadow p-4">
        <h2 className="text-lg font-semibold">{t("staff_list")}</h2>
        <div className="overflow-x-auto mt-3">
          <table className="min-w-full border text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="border px-3 py-2 text-left">{t("name")}</th>
                <th className="border px-3 py-2 text-left">{t("email")}</th>
                <th className="border px-3 py-2">{t("status")}</th>
                <th className="border px-3 py-2 text-center">{t("actions")}</th>
              </tr>
            </thead>
            <tbody>
              {staffs.map((s) => {
                const isInvite = s.kind === "invite";

                return (
                  <tr
                    key={`${isInvite ? "invite" : "staff"}-${s.id ?? s.email}`}
                    className="hover:bg-gray-50"
                  >
                    <td className="border px-3 py-2">{s.name || "-"}</td>
                    <td className="border px-3 py-2">{s.email}</td>

                    <td className="border px-3 py-2 text-center">
                      {isInvite ? (
                        <span className="text-orange-500">
                          {t("staff_status_invited") || t("invited")}
                        </span>
                      ) : s.is_active ? (
                        <span className="text-green-600">{t("active")}</span>
                      ) : (
                        <span className="text-red-600">{t("inactive")}</span>
                      )}
                    </td>

                    <td className="border px-3 py-2 text-center space-x-2">
                      {/* Pending invite → only resend */}
                      {isInvite && (
                        <button
                          onClick={() => resendInvite(s.email)}
                          className="text-xs underline text-blue-600"
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
                              className="text-xs underline text-blue-600"
                            >
                              {t("reset_password")}
                            </button>

                            <button
                              onClick={() => deactivateStaff(s.id)}
                              className="text-xs underline text-red-600"
                            >
                              {t("deactivate")}
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => activateStaff(s.id)}
                            className="text-xs underline text-green-600"
                          >
                            {t("activate")}
                          </button>
                        ))}
                    </td>
                  </tr>
                );
              })}

              {staffs.length === 0 && (
                <tr>
                  <td colSpan="4" className="text-center py-3 text-gray-500">
                    {t("no_staff")}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
