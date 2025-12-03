import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import GoogleIcon from "../components/icons/GoogleIcon.jsx";
import ChecklistItem from "../components/ChecklistItem.jsx";
import api from "../lib/api";
import {
  mapFieldValidationErrors,
  getGlobalErrorFromAxios,
} from "../lib/errorHelpers";
import LanguageSwitcher from "../components/LanguageSwitcher.jsx";
import { useToast } from "../components/ToastProvider";
import { useNavigate, Link } from "react-router-dom";

const API = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

const ALLOWED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/jpg"];
const MAX_BYTES = 2 * 1024 * 1024;
const MAX_W = 1024;
const MAX_H = 1024;

export default function Signup() {
  const { t } = useTranslation("auth");
  const params = new URLSearchParams(location.search);
  const initialEmail = params.get("email") || "";
  const [form, setForm] = useState({
    name: "",
    email: initialEmail,
    password: "",
    confirm_password: "",
    shop_name: "",
  });
  const [logo, setLogo] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [logoMeta, setLogoMeta] = useState({ w: null, h: null, error: "" });
  const [fieldErrors, setFieldErrors] = useState({});
  const { showToast } = useToast();
  const navigate = useNavigate();

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
    form.confirm_password &&
    form.password === form.confirm_password;
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
    if (!allPwOk) return t("password_requirements_error");
    if (!pwMatch) return t("confirm_password_incorrect"); // simple hint
    if (logoMeta.error) return logoMeta.error;
    return "";
  };

  useEffect(() => {
    const handler = (ev) => {
      if (ev.data?.type === "google-auth-result") {
        const { payload } = ev.data;
        if (payload?.token) {
          localStorage.setItem("token", payload.token);
          localStorage.setItem("tokenType", "owner");
          navigate("/", { replace: true });
        } else if (payload?.errors) {
          alert(payload.errors.map((code) => t(`errors.${code}`)).join("\n"));
        } else {
          alert(t("errors.9000"));
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

  const updateField = (field, value) => {
    // Update the form state
    setForm((prev) => ({ ...prev, [field]: value }));

    // Clear field-level error
    setFieldErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const submit = async (e) => {
    e.preventDefault();
    setFieldErrors({});

    const v = validateBeforeSubmit();
    if (v) {
      showToast({ type: "error", message: v });
      return;
    }

    const fd = new FormData();
    fd.append("name", form.name);
    fd.append("email", form.email);
    fd.append("password", form.password);
    fd.append("confirm_password", form.confirm_password);
    fd.append("shop_name", form.shop_name);
    if (logo) fd.append("logo", logo);

    try {
      const res = await api.post("/auth/signup", fd, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      const data = res.data;

      if (data?.success) {
        // You can show a success toast using messages.SIGNUP_SUCCESS_NEED_VERIFY if you want
        // const msgKey = `messages.${data.message}`;
        // toast(t(msgKey) !== msgKey ? t(msgKey) : t("messages.SIGNUP_SUCCESS_NEED_VERIFY"));
        showToast({
          type: "success",
          message: t("signup_success"),
          duration: 10000,
        });
        navigate("/login", { replace: true });
        return;
      }
    } catch (err) {
      if (!err.response) {
        // network or unknown
        showToast({ type: "error", message: getGlobalErrorFromAxios(err, t) });
        return;
      }

      const { status, data } = err.response;

      // Validation errors (422) with field mapping
      if (status === 422 && data?.errors && typeof data.errors === "object") {
        const fe = mapFieldValidationErrors(data.errors, t);
        setFieldErrors(fe);

        // Also set a generic validation message at top (optional)
        const globalMsg = getGlobalErrorFromAxios(err, t, {
          defaultValidationCode: 1000,
        });
        showToast({ type: "error", message: globalMsg });
        return;
      }

      // Non-validation error with message as code
      showToast({ type: "error", message: getGlobalErrorFromAxios(err, t) });
    }
  };

  return (
    <div className="min-h-screen w-full relative bg-gray-50 flex items-center justify-center p-4">
      <form
        onSubmit={submit}
        className="bg-white shadow-xl rounded-2xl w-full max-w-md p-4"
      >
        <div className="flex flex-row items-center justify-between">
          <h1 className="text-xl font-semibold">{t("create_account")}</h1>
          <LanguageSwitcher />
        </div>

        {/* Shop name */}
        <label className="block mt-4 text-sm">{t("common:shop_name")}</label>
        <input
          className={`border p-2 rounded w-full ${
            fieldErrors.shop_name ? "border-red-500" : ""
          }`}
          value={form.shop_name}
          onChange={(e) => updateField("shop_name", e.target.value)}
          required
        />
        {fieldErrors.shop_name && (
          <div className="mt-1 text-xs text-red-600">
            {fieldErrors.shop_name}
          </div>
        )}

        {/* Shop logo with preview + bullets */}
        <label className="block mt-4 text-sm">{t("common:shop_logo")}</label>
        <input
          className={"border p-2 rounded w-full"}
          type="file"
          accept="image/png,image/jpeg"
          onChange={(e) => {
            setLogo(e.target.files?.[0] || null);

            // Clear field error for "logo"
            setFieldErrors((prev) => {
              if (!prev.logo) return prev;
              const next = { ...prev };
              delete next.logo;
              return next;
            });
          }}
          required
        />
        <div className="mt-2">
          <div className="text-xs text-gray-500 font-medium">
            {t("common:logo_requirements_title")}
          </div>
          <ul className="mt-1 text-xs text-gray-500 list-disc pl-5">
            <li>{t("common:logo_req_size")}</li>
            <li>{t("common:logo_req_resolution")}</li>
            <li>{t("common:logo_req_types")}</li>
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
              className="h-20 w-20 rounded border"
            />
          </div>
        )}
        {logoMeta.error && (
          <div className="mt-2 text-xs text-red-600">{logoMeta.error}</div>
        )}
        {fieldErrors.logo && (
          <div className="mt-1 text-xs text-red-600">{fieldErrors.logo}</div>
        )}

        {/* Your name */}
        <label className="block mt-4 text-sm">{t("common:your_name")}</label>
        <input
          className={`border p-2 rounded w-full ${
            fieldErrors.name ? "border-red-500" : ""
          }`}
          value={form.name}
          onChange={(e) => updateField("name", e.target.value)}
          required
        />
        {fieldErrors.name && (
          <div className="mt-1 text-xs text-red-600">{fieldErrors.name}</div>
        )}

        {/* Email */}
        <label className="block mt-4 text-sm">{t("common:email")}</label>
        <input
          type="email"
          className={`border p-2 rounded w-full ${
            fieldErrors.email ? "border-red-500" : ""
          }`}
          value={form.email}
          onChange={(e) => updateField("email", e.target.value)}
          required
        />
        {fieldErrors.email && (
          <div className="mt-1 text-xs text-red-600">{fieldErrors.email}</div>
        )}

        {/* Password */}
        <label className="block mt-4 text-sm">{t("common:password")}</label>
        <input
          type="password"
          className={`border p-2 rounded w-full ${
            fieldErrors.password ? "border-red-500" : ""
          }`}
          value={form.password}
          onChange={(e) => updateField("password", e.target.value)}
          required
        />
        {fieldErrors.password && (
          <div className="mt-1 text-xs text-red-600">
            {fieldErrors.password}
          </div>
        )}

        {/* Confirm Password */}
        <label className="block mt-4 text-sm">
          {t("common:confirm_password")}
        </label>
        <input
          type="password"
          className={`border p-2 rounded w-full ${
            fieldErrors.confirm_password ? "border-red-500" : ""
          }`}
          value={form.confirm_password}
          onChange={(e) => updateField("confirm_password", e.target.value)}
          required
        />
        {fieldErrors.confirm_password && (
          <div className="mt-1 text-xs text-red-600">
            {fieldErrors.confirm_password}
          </div>
        )}

        <div className="mt-2">
          <div className="text-xs text-gray-500 font-medium">
            {t("password_requirements_title")}
          </div>
          <ul className="mt-1 text-xs list-disc pl-5">
            <ChecklistItem
              ok={pwChecks.length}
              label={t("password_rule_length")}
            />
            <ChecklistItem
              ok={pwChecks.upper}
              label={t("password_rule_uppercase")}
            />
            <ChecklistItem
              ok={pwChecks.number}
              label={t("password_rule_number")}
            />
            <ChecklistItem
              ok={pwChecks.allowed}
              label={t("password_rule_symbol")}
            />
            <ChecklistItem ok={pwMatch} label={t("password_rule_match")} />
          </ul>
        </div>

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
          <Link to="/login" className="underline text-blue-700">
            {t("login")}
          </Link>
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
  );
}
