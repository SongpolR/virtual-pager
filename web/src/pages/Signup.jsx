import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import GoogleIcon from "../components/icons/GoogleIcon.jsx";
import ChecklistItem from "../components/ChecklistItem.jsx";

const API = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

const ALLOWED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/jpg"];
const MAX_BYTES = 2 * 1024 * 1024;
const MAX_W = 1024;
const MAX_H = 1024;

export default function Signup() {
  const { t } = useTranslation();
  const params = new URLSearchParams(location.search);
  const initialEmail = params.get("email") || "";
  const [form, setForm] = useState({
    name: "",
    email: initialEmail,
    password: "",
    password_confirmation: "",
    shop_name: "",
  });
  const [logo, setLogo] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [logoMeta, setLogoMeta] = useState({ w: null, h: null, error: "" });
  const [submitErr, setSubmitErr] = useState("");

  // Password live checks
  const pw = form.password || "";
  const pwChecks = useMemo(
    () => ({
      length: pw.length >= 8,
      upper: /[A-Z]/.test(pw),
      number: /[0-9]/.test(pw),
      allowed: /[!@#$%^&*._-]/.test(pw), // allow empty during typing
    }),
    [pw]
  );
  const pwMatch =
    form.password &&
    form.password_confirmation &&
    form.password === form.password_confirmation;
  const allPwOk =
    pw &&
    pwChecks.length &&
    pwChecks.upper &&
    pwChecks.number &&
    pwChecks.allowed;

  // Handle logo selection + immediate validation & preview
  useEffect(() => {
    if (!logo) {
      if (logoPreview) URL.revokeObjectURL(logoPreview);
      setLogoPreview(null);
      setLogoMeta({ w: null, h: null, error: "" });
      return;
    }

    // Basic type/size checks
    if (!ALLOWED_IMAGE_TYPES.includes(logo.type)) {
      setLogoMeta({ w: null, h: null, error: t("invalid_image_file") });
      return;
    }
    if (logo.size > MAX_BYTES) {
      setLogoMeta({ w: null, h: null, error: t("logo_too_big") });
      return;
    }

    const url = URL.createObjectURL(logo);
    setLogoPreview(url);

    const img = new Image();
    img.onload = () => {
      const w = img.naturalWidth,
        h = img.naturalHeight;
      if (w > MAX_W || h > MAX_H) {
        setLogoMeta({ w, h, error: t("logo_too_large_resolution") });
      } else {
        setLogoMeta({ w, h, error: "" });
      }
    };
    img.onerror = () =>
      setLogoMeta({ w: null, h: null, error: t("invalid_image_file") });
    img.src = url;

    return () => URL.revokeObjectURL(url);
  }, [logo, t]); // revoke preview when unmount or new file chosen

  const validateBeforeSubmit = () => {
    if (!allPwOk) return t("password_requirements_title");
    if (!pwMatch) return t("confirm_password"); // simple hint
    if (logoMeta.error) return logoMeta.error;
    return "";
  };

  useEffect(() => {
    const handler = (ev) => {
      if (ev.data?.type === "google-auth-result") {
        const { payload } = ev.data;
        if (payload?.token) {
          localStorage.setItem("token", payload.token);
          location.href = "/";
        } else if (payload?.errors) {
          alert(payload.errors.map((code) => t(`errors.${code}`)).join("\n"));
        } else {
          alert(t("errors.1999"));
        }
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [t]);

  const loginGoogle = () => {
    // open popup to backend redirect endpoint
    window.open(
      `${API}/auth/google/redirect`,
      "google",
      "width=520,height=640"
    );
  };

  const submit = async (e) => {
    e.preventDefault();
    setSubmitErr("");

    const v = validateBeforeSubmit();
    if (v) {
      setSubmitErr(v);
      return;
    }

    const fd = new FormData();
    fd.append("name", form.name);
    fd.append("email", form.email);
    fd.append("password", form.password);
    fd.append("password_confirmation", form.password_confirmation);
    fd.append("shop_name", form.shop_name);
    if (logo) fd.append("logo", logo);

    const res = await fetch(`${API}/auth/signup`, { method: "POST", body: fd });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      if (Array.isArray(data.errors)) {
        const msgs = data.errors.map(
          (code) => t(`errors.${code}`) // lookup numeric key
        );
        setSubmitErr(msgs.join(", "));
      } else {
        setSubmitErr(data.message || "Unknown error");
      }
      return;
    }
    const data = await res.json();
    localStorage.setItem("token", data.token);
    location.href = "/login";
  };

  return (
    <div className="min-h-screen relative">
      <div className="min-h-screen flex items-center justify-center">
        <form
          onSubmit={submit}
          className="bg-white p-6 rounded-xl shadow w-[420px]"
        >
          <h1 className="text-xl font-semibold">{t("create_account")}</h1>

          {/* Shop name */}
          <label className="block mt-4 text-sm">{t("shop_name")}</label>
          <input
            className="border p-2 rounded w-full"
            required
            value={form.shop_name}
            onChange={(e) => setForm({ ...form, shop_name: e.target.value })}
          />

          {/* Shop logo with preview + bullets */}
          <label className="block mt-4 text-sm">{t("shop_logo")}</label>
          <input
            type="file"
            accept="image/png,image/jpeg"
            onChange={(e) => setLogo(e.target.files?.[0] || null)}
          />
          <div className="mt-2">
            <div className="text-xs text-gray-500 font-medium">
              {t("logo_requirements_title")}
            </div>
            <ul className="mt-1 text-xs text-gray-500 list-disc pl-5">
              <li>{t("logo_req_size")}</li>
              <li>{t("logo_req_resolution")}</li>
              <li>{t("logo_req_types")}</li>
            </ul>
          </div>

          {logoPreview && (
            <div className="mt-3">
              <div className="text-xs text-gray-600 mb-1">
                {t("preview")}{" "}
                {logoMeta.w && logoMeta.h
                  ? `(${logoMeta.w}×${logoMeta.h}px)`
                  : ""}
              </div>
              <img
                src={logoPreview}
                alt="logo preview"
                className="h-20 w-auto rounded border"
              />
            </div>
          )}
          {logoMeta.error && (
            <div className="mt-2 text-xs text-red-600">{logoMeta.error}</div>
          )}

          {/* Your name */}
          <label className="block mt-4 text-sm">{t("your_name")}</label>
          <input
            className="border p-2 rounded w-full"
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />

          {/* Email */}
          <label className="block mt-4 text-sm">{t("email")}</label>
          <input
            type="email"
            className="border p-2 rounded w-full"
            required
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />

          {/* Password with live checklist */}
          <label className="block mt-4 text-sm">{t("password")}</label>
          <input
            type="password"
            className="border p-2 rounded w-full"
            required
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />

          {/* Password confirmation */}
          <label className="block mt-4 text-sm">{t("confirm_password")}</label>
          <input
            type="password"
            className="border p-2 rounded w-full"
            required
            value={form.password_confirmation}
            onChange={(e) =>
              setForm({ ...form, password_confirmation: e.target.value })
            }
          />

          <div className="mt-2">
            <div className="text-xs text-gray-500 font-medium">
              {t("password_requirements_title")}
            </div>
            <ul className="mt-1 text-xs list-disc pl-5">
              <ChecklistItem ok={pwChecks.length} label={t("pw_req_length")} />
              <ChecklistItem ok={pwChecks.upper} label={t("pw_req_upper")} />
              <ChecklistItem ok={pwChecks.number} label={t("pw_req_number")} />
              <ChecklistItem ok={pwChecks.allowed} label={t("pw_req_chars")} />
              <ChecklistItem ok={pwMatch} label={t("pw_req_match")} />
            </ul>
          </div>

          {/* Submit error */}
          {submitErr && (
            <div className="text-red-600 text-sm mt-3">{submitErr}</div>
          )}

          {/* Submit */}
          <button
            className="mt-4 w-full bg-black text-white rounded py-2 disabled:opacity-50"
            disabled={
              !form.shop_name ||
              !form.name ||
              !form.email ||
              !allPwOk ||
              !pwMatch ||
              !!logoMeta.error
            }
          >
            {t("signup")}
          </button>

          <div className="mt-4 text-center text-sm">
            {t("or_signin")}{" "}
            <a className="text-blue-600 underline" href="/login">
              {t("login")}
            </a>
            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={loginGoogle}
                className="flex items-center justify-center w-full gap-2 border border-gray-300 rounded py-2 hover:bg-gray-50 transition-colors"
              >
                <GoogleIcon size={18} />
                <span>{t("sign_in_google")}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
