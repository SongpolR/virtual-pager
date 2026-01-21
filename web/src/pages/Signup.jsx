import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import GoogleIcon from "../components/icons/GoogleIcon.jsx";
import ChecklistItem from "../components/ChecklistItem.jsx";
import api from "../lib/api";
import {
  mapFieldValidationErrors,
  getGlobalErrorFromAxios,
} from "../lib/errorHelpers";
import { useToast } from "../components/ToastProvider";
import { useNavigate, Link } from "react-router-dom";
import AuthLayout from "../components/layout/AuthLayout.jsx";

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
      allowed: /[!@#$%^&*._-]/.test(pw),
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

    if (!ALLOWED_IMAGE_TYPES.includes(logo.type)) {
      setLogoMeta({ w: null, h: null, error: t("invalid_image_file") });
      return;
    }
    if (logo.size > MAX_BYTES) {
      setLogoMeta({ w: null, h: null, error: t("logo_too_big") });
      return;
    }

    const url = URL.createObjectURL(logo);
    console.log(`Logo URL ${url}`);
    setLogoPreview(url);

    const img = new Image();
    img.onload = () => {
      const w = img.naturalWidth;
      const h = img.naturalHeight;
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
  }, [logo, t]);

  const validateBeforeSubmit = () => {
    if (!allPwOk) return t("password_requirements_error");
    if (!pwMatch) return t("confirm_password_incorrect");
    if (logoMeta.error) return logoMeta.error;
    return "";
  };

  // Google result handler (same pattern as Login)
  useEffect(() => {
    const handler = (ev) => {
      if (ev.data?.type === "google-auth-result") {
        const { payload } = ev.data;
        if (payload?.token) {
          localStorage.setItem("token", payload.token);
          localStorage.setItem("tokenType", "owner");
          navigate("/", { replace: true });
        } else if (payload?.errors) {
          alert(
            payload.errors.map((code) => t(`common:errors.${code}`)).join("\n")
          );
        } else {
          alert(t("common:errors.9000"));
        }
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [t, navigate]);

  const loginGoogle = () => {
    window.open(
      `${API}/auth/google/redirect`,
      "google",
      "width=520,height=640"
    );
  };

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));

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
        showToast({ type: "error", message: getGlobalErrorFromAxios(err, t) });
        return;
      }

      const { status, data } = err.response;

      if (status === 422 && data?.errors && typeof data.errors === "object") {
        const fe = mapFieldValidationErrors(data.errors, t);
        setFieldErrors(fe);

        const globalMsg = getGlobalErrorFromAxios(err, t, {
          defaultValidationCode: 1000,
        });
        showToast({ type: "error", message: globalMsg });
        return;
      }

      showToast({ type: "error", message: getGlobalErrorFromAxios(err, t) });
    }
  };

  const isSubmitDisabled =
    !form.shop_name ||
    !form.name ||
    !form.email ||
    !allPwOk ||
    !pwMatch ||
    !!logoMeta.error;

  return (
    <AuthLayout title={t("create_account")} subtitle={t("signup_subtitle")}>
      <form onSubmit={submit} encType="multipart/form-data">
        {/* Shop name */}
        <label className="mt-2 block text-xs font-medium text-slate-700 dark:text-slate-300">
          {t("common:shop_name")}
        </label>
        <input
          className={[
            "mt-1 w-full rounded-lg border p-2.5 text-sm",
            "bg-white text-slate-900 placeholder:text-slate-400",
            "focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 focus:ring-offset-slate-100",
            "dark:bg-slate-900/80 dark:text-slate-100 dark:placeholder:text-slate-500",
            "dark:focus:ring-offset-slate-900",
            fieldErrors.shop_name
              ? "border-red-500 focus:ring-red-500"
              : "border-slate-300 dark:border-slate-700",
          ].join(" ")}
          value={form.shop_name}
          onChange={(e) => updateField("shop_name", e.target.value)}
          required
        />
        {fieldErrors.shop_name && (
          <div className="mt-1 text-xs text-red-500 dark:text-red-400">
            {fieldErrors.shop_name}
          </div>
        )}

        {/* Shop logo */}
        <label className="mt-4 block text-xs font-medium text-slate-700 dark:text-slate-300">
          {t("common:shop_logo")}
        </label>
        <input
          className={[
            "mt-1 block w-full cursor-pointer rounded-lg border p-2 text-xs",
            "bg-white text-slate-700 file:mr-3 file:cursor-pointer file:rounded-md file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-slate-800",
            "hover:file:bg-slate-200",
            "dark:bg-slate-900/80 dark:text-slate-200 dark:file:bg-slate-800 dark:file:text-slate-100 dark:hover:file:bg-slate-700",
            fieldErrors.logo || logoMeta.error
              ? "border-red-500"
              : "border-slate-300 dark:border-slate-700",
          ].join(" ")}
          type="file"
          accept="image/png,image/jpeg"
          onChange={(e) => {
            setLogo(e.target.files?.[0] || null);
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
          <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
            {t("common:logo_requirements_title")}
          </div>
          <ul className="mt-1 list-disc pl-5 text-xs text-slate-500 dark:text-slate-400">
            <li>{t("common:logo_req_size")}</li>
            <li>{t("common:logo_req_resolution")}</li>
            <li>{t("common:logo_req_types")}</li>
          </ul>
        </div>

        {logoPreview && (
          <div className="mt-3">
            <div className="mb-1 text-xs text-slate-600 dark:text-slate-300">
              {t("common:preview")}{" "}
              {logoMeta.w && logoMeta.h
                ? `(${logoMeta.w}×${logoMeta.h}px)`
                : ""}
            </div>
            <img
              src={logoPreview}
              alt="logo preview"
              className="h-20 w-20 rounded border border-slate-200 object-contain dark:border-slate-600"
            />
          </div>
        )}
        {logoMeta.error && (
          <div className="mt-2 text-xs text-red-500 dark:text-red-400">
            {logoMeta.error}
          </div>
        )}
        {fieldErrors.logo && (
          <div className="mt-1 text-xs text-red-500 dark:text-red-400">
            {fieldErrors.logo}
          </div>
        )}

        {/* Your name */}
        <label className="mt-4 block text-xs font-medium text-slate-700 dark:text-slate-300">
          {t("common:your_name")}
        </label>
        <input
          className={[
            "mt-1 w-full rounded-lg border p-2.5 text-sm",
            "bg-white text-slate-900 placeholder:text-slate-400",
            "focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 focus:ring-offset-slate-100",
            "dark:bg-slate-900/80 dark:text-slate-100 dark:placeholder:text-slate-500",
            "dark:focus:ring-offset-slate-900",
            fieldErrors.name
              ? "border-red-500 focus:ring-red-500"
              : "border-slate-300 dark:border-slate-700",
          ].join(" ")}
          value={form.name}
          onChange={(e) => updateField("name", e.target.value)}
          required
        />
        {fieldErrors.name && (
          <div className="mt-1 text-xs text-red-500 dark:text-red-400">
            {fieldErrors.name}
          </div>
        )}

        {/* Email */}
        <label className="mt-4 block text-xs font-medium text-slate-700 dark:text-slate-300">
          {t("common:email")}
        </label>
        <input
          type="email"
          className={[
            "mt-1 w-full rounded-lg border p-2.5 text-sm",
            "bg-white text-slate-900 placeholder:text-slate-400",
            "focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 focus:ring-offset-slate-100",
            "dark:bg-slate-900/80 dark:text-slate-100 dark:placeholder:text-slate-500",
            "dark:focus:ring-offset-slate-900",
            fieldErrors.email
              ? "border-red-500 focus:ring-red-500"
              : "border-slate-300 dark:border-slate-700",
          ].join(" ")}
          value={form.email}
          onChange={(e) => updateField("email", e.target.value)}
          required
        />
        {fieldErrors.email && (
          <div className="mt-1 text-xs text-red-500 dark:text-red-400">
            {fieldErrors.email}
          </div>
        )}

        {/* Password */}
        <label className="mt-4 block text-xs font-medium text-slate-700 dark:text-slate-300">
          {t("common:password")}
        </label>
        <input
          type="password"
          className={[
            "mt-1 w-full rounded-lg border p-2.5 text-sm",
            "bg-white text-slate-900 placeholder:text-slate-400",
            "focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 focus:ring-offset-slate-100",
            "dark:bg-slate-900/80 dark:text-slate-100 dark:placeholder:text-slate-500",
            "dark:focus:ring-offset-slate-900",
            fieldErrors.password
              ? "border-red-500 focus:ring-red-500"
              : "border-slate-300 dark:border-slate-700",
          ].join(" ")}
          value={form.password}
          onChange={(e) => updateField("password", e.target.value)}
          required
        />
        {fieldErrors.password && (
          <div className="mt-1 text-xs text-red-500 dark:text-red-400">
            {fieldErrors.password}
          </div>
        )}

        {/* Confirm Password */}
        <label className="mt-4 block text-xs font-medium text-slate-700 dark:text-slate-300">
          {t("common:confirm_password")}
        </label>
        <input
          type="password"
          className={[
            "mt-1 w-full rounded-lg border p-2.5 text-sm",
            "bg-white text-slate-900 placeholder:text-slate-400",
            "focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 focus:ring-offset-slate-100",
            "dark:bg-slate-900/80 dark:text-slate-100 dark:placeholder:text-slate-500",
            "dark:focus:ring-offset-slate-900",
            fieldErrors.confirm_password
              ? "border-red-500 focus:ring-red-500"
              : "border-slate-300 dark:border-slate-700",
          ].join(" ")}
          value={form.confirm_password}
          onChange={(e) => updateField("confirm_password", e.target.value)}
          required
        />
        {fieldErrors.confirm_password && (
          <div className="mt-1 text-xs text-red-500 dark:text-red-400">
            {fieldErrors.confirm_password}
          </div>
        )}

        {/* Password requirements */}
        <div className="mt-3">
          <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
            {t("password_requirements_title")}
          </div>
          <ul className="mt-1 list-disc pl-5 text-xs">
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
          type="submit"
          className={[
            "mt-4 flex w-full items-center justify-center rounded-full px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-indigo-500/40 transition",
            "bg-indigo-500 hover:-translate-y-[1px] hover:bg-indigo-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300 active:translate-y-0 active:scale-[0.99]",
            "disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:bg-indigo-500",
          ].join(" ")}
          disabled={isSubmitDisabled}
        >
          {t("signup")}
        </button>

        {/* Footer: already have an account + Google sign-in */}
        <div className="mt-5 text-center text-xs text-slate-500 dark:text-slate-400">
          {t("or_signin")}{" "}
          <Link
            to="/login"
            className="font-medium text-indigo-600 underline-offset-2 hover:text-indigo-500 hover:underline dark:text-indigo-300 dark:hover:text-indigo-200"
          >
            {t("login")}
          </Link>
        </div>

        <div className="mt-3">
          <button
            type="button"
            onClick={loginGoogle}
            className="flex w-full items-center justify-center gap-2 rounded-full border border-slate-300 bg-slate-50 px-4 py-2.5 text-xs font-medium text-slate-700 transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300 dark:border-slate-700/80 dark:bg-slate-900/70 dark:text-slate-200 dark:hover:bg-slate-800/80 dark:focus-visible:ring-slate-500"
          >
            <GoogleIcon size={18} />
            <span>{t("sign_in_google")}</span>
          </button>
        </div>
      </form>
    </AuthLayout>
  );
}
