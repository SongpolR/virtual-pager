// web/src/pages/Login.jsx
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import api from "../lib/api";
import {
  mapFieldValidationErrors,
  getGlobalErrorFromAxios,
} from "../lib/errorHelpers";
import GoogleIcon from "../components/icons/GoogleIcon.jsx";
import { useToast } from "../components/ToastProvider";
import { Link, useNavigate } from "react-router-dom";
import AuthLayout from "../components/layout/AuthLayout.jsx";

const API = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

export default function Login() {
  const { t } = useTranslation("auth");
  const [mode, setMode] = useState("owner"); // 'owner' | 'staff'
  const [fieldErrors, setFieldErrors] = useState({});
  const [form, setForm] = useState({
    email: "",
    password: "",
    shop_code: "",
  });
  const [errBlock, setErrBlock] = useState(null);
  const { showToast } = useToast();
  const navigate = useNavigate();

  const isOwner = mode === "owner";

  // Preselect mode & email via URL params
  useEffect(() => {
    const p = new URLSearchParams(location.search);
    const mode = p.get("mode");
    const email = p.get("email");
    const shopCode = p.get("shop_code");
    if (mode === "staff" || mode === "owner") setMode(mode);
    if (email) setForm((prev) => ({ ...prev, email: email }));
    if (shopCode) setForm((prev) => ({ ...prev, shop_code: shopCode }));
  }, []);

  // Google login result handler
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

    if (errBlock) setErrBlock(null);
  };

  const submit = async (e) => {
    e.preventDefault();
    setFieldErrors({});
    setErrBlock(null);

    try {
      const res = isOwner
        ? await api.post("/auth/login", {
            email: form.email.trim(),
            password: form.password,
          })
        : await api.post("/staff/login", {
            email: form.email.trim(),
            password: form.password,
            shop_code: form.shop_code.trim(),
          });
      const data = res.data;

      if (data?.success) {
        const token = data.data?.token ?? data.token;
        if (token) {
          localStorage.setItem("token", token);
          localStorage.setItem("tokenType", mode);
          navigate("/orders", { replace: true });
          return;
        }
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

      if (data?.message) {
        const messageCode = data.message;
        setErrBlock({ code: messageCode, mode });
        return;
      }

      showToast({ type: "error", message: getGlobalErrorFromAxios(err, t) });
    }
  };

  // Mode toggle UI (goes into AuthLayout headerRight)
  const modeToggle = (
    <div className="inline-flex rounded-full border border-slate-200 bg-slate-50 p-1 text-[11px] font-medium text-slate-600 shadow-sm dark:border-slate-700/60 dark:bg-slate-900/80 dark:text-slate-300">
      <button
        type="button"
        onClick={() => toggleMode("owner")}
        className={[
          "flex items-center gap-1 rounded-full px-3 py-1 transition-all",
          isOwner
            ? "bg-slate-900 text-slate-100 shadow-sm dark:bg-slate-950"
            : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100",
        ].join(" ")}
      >
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
        {t("login_type_owner_short") || t("login_type_owner")}
      </button>
      <button
        type="button"
        onClick={() => toggleMode("staff")}
        className={[
          "flex items-center gap-1 rounded-full px-3 py-1 transition-all",
          !isOwner
            ? "bg-slate-900 text-slate-100 shadow-sm dark:bg-slate-950"
            : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100",
        ].join(" ")}
      >
        <span className="h-1.5 w-1.5 rounded-full bg-indigo-400" />
        {t("login_type_staff_short") || t("login_type_staff")}
      </button>
    </div>
  );

  const toggleMode = (mode) => {
    setMode(mode);
    setForm({ email: "", password: "", shop_code: "" });
    setFieldErrors({});
    setErrBlock(null);
  };

  const subtitle = isOwner
    ? t("login_sub_owner") || "Sign in as shop owner"
    : t("login_sub_staff") || "Sign in as staff";

  return (
    <AuthLayout title={t("login")} subtitle={subtitle} headerRight={modeToggle}>
      <form onSubmit={submit}>
        {errBlock && <LoginErrorPanel {...errBlock} t={t} />}

        {/* Email */}
        <label className="mt-2 block text-xs font-medium text-slate-700 dark:text-slate-300">
          {t("common:email")}
        </label>
        <input
          name="email"
          type="email"
          required
          value={form.email}
          onChange={(e) => updateField("email", e.target.value)}
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
          placeholder="name@example.com"
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
          name="password"
          type="password"
          required
          value={form.password}
          onChange={(e) => updateField("password", e.target.value)}
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
          placeholder="••••••••"
        />
        {fieldErrors.password && (
          <div className="mt-1 text-xs text-red-500 dark:text-red-400">
            {fieldErrors.password}
          </div>
        )}

        {/* Shop Code */}
        {mode === "staff" && (
          <>
            <label className="mt-4 block text-xs font-medium text-slate-700 dark:text-slate-300">
              {t("common:shop_code")}
            </label>
            <input
              name="shop_code"
              type="text"
              required
              value={form.shop_code}
              onChange={(e) => {
                // 1) uppercase
                let v = e.target.value.toUpperCase();

                // 2) keep only A-Z and 0-9
                v = v.replace(/[^A-Z0-9]/g, "");

                // 3) max 12 chars (6 + 6)
                v = v.slice(0, 12);

                // 4) insert dash after 6
                if (v.length > 6) v = `${v.slice(0, 6)}-${v.slice(6)}`;

                updateField("shop_code", v);
              }}
              inputMode="text"
              autoCapitalize="characters"
              maxLength={13} // XXXXXX-XXXXXX
              pattern="[A-Za-z0-9]{6}-[A-Za-z0-9]{6}"
              title="Format: XXXXXX-XXXXXX (A-Z, 0-9 only)"
              className={[
                "mt-1 w-full rounded-lg border p-2.5 text-sm uppercase",
                "bg-white text-slate-900 placeholder:text-slate-400",
                "focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 focus:ring-offset-slate-100",
                "dark:bg-slate-900/80 dark:text-slate-100 dark:placeholder:text-slate-500",
                "dark:focus:ring-offset-slate-900",
                fieldErrors.shop_code
                  ? "border-red-500 focus:ring-red-500"
                  : "border-slate-300 dark:border-slate-700",
              ].join(" ")}
              placeholder="MYSHOP-123456"
            />

            <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
              {t("shop_code_login_hint") ||
                "This code is used for staff login. You can share it with your staff."}
            </p>
            {fieldErrors.shop_code && (
              <div className="mt-1 text-xs text-red-500 dark:text-red-400">
                {fieldErrors.shop_code}
              </div>
            )}
          </>
        )}

        {/* Submit */}
        <button
          type="submit"
          className="mt-6 flex w-full items-center justify-center rounded-full bg-indigo-500 px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-indigo-500/40 transition hover:-translate-y-[1px] hover:bg-indigo-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300 active:translate-y-0 active:scale-[0.99]"
        >
          {t("login")}
        </button>

        {/* Google sign-in (owner only) */}
        {isOwner && (
          <button
            type="button"
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-full border border-slate-300 bg-slate-50 px-4 py-2.5 text-xs font-medium text-slate-700 transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300 dark:border-slate-700/80 dark:bg-slate-900/70 dark:text-slate-200 dark:hover:bg-slate-800/80 dark:focus-visible:ring-slate-500"
            onClick={loginGoogle}
          >
            <GoogleIcon size={18} />
            {t("sign_in_google")}
          </button>
        )}

        {/* Footer links */}
        <div className="mt-6 text-center text-xs text-slate-500 dark:text-slate-400">
          {isOwner ? (
            <>
              {t("create_account")}?{" "}
              <Link
                to="/signup"
                className="font-medium text-indigo-600 underline-offset-2 hover:text-indigo-500 hover:underline dark:text-indigo-300 dark:hover:text-indigo-200"
              >
                {t("signup")}
              </Link>
            </>
          ) : (
            <button
              onClick={(e) => {
                e.preventDefault();
                setMode("owner");
              }}
              className="font-medium text-indigo-600 underline-offset-2 hover:text-indigo-500 hover:underline dark:text-indigo-300 dark:hover:text-indigo-200"
            >
              {t("switch_to_owner_login")}
            </button>
          )}
        </div>
      </form>
    </AuthLayout>
  );
}

/** Inline error box renderer (unchanged, just reused) */
function LoginErrorPanel({ code, email, mode, t }) {
  const wrap = (node) => (
    <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700 dark:border-red-500/50 dark:bg-red-950/50 dark:text-red-100">
      {node}
    </div>
  );

  // OWNER
  if (mode === "owner") {
    if (code === "EMAIL_NOT_VERIFIED") {
      return wrap(
        <>
          {t("login_error_unverified")}{" "}
          <Link
            className="font-medium text-red-700 underline underline-offset-2 dark:text-red-200"
            to={`/verify-email?email=${encodeURIComponent(email)}`}
          >
            {t("verify_now")}
          </Link>
        </>
      );
    }
    if (code === "INVALID_CREDENTIAL") {
      return wrap(
        <>
          {t("login_error_bad_password")}{" "}
          <Link
            className="font-medium text-red-700 underline underline-offset-2 dark:text-red-200"
            to={`/forgot-password?email=${encodeURIComponent(email)}`}
          >
            {t("reset_password")}
          </Link>
        </>
      );
    }
    if (code === "ACCOUNT_NOT_FOUND") {
      return wrap(
        <>
          {t("login_error_no_account")}{" "}
          <Link
            className="font-medium text-red-700 underline underline-offset-2 dark:text-red-200"
            to={`/signup?email=${encodeURIComponent(email)}`}
          >
            {t("create_account")}
          </Link>
        </>
      );
    }
    return wrap(t("errors.9000"));
  }

  // STAFF
  if (mode === "staff") {
    if (code === "ACCOUNT_NOT_FOUND") {
      return wrap(
        <>
          {t("login_staff_not_found")} {t("login_staff_contact_owner")}
        </>
      );
    }
    if (code === "INVITE_PENDING") {
      return wrap(
        <>
          {t("login_staff_invite_pending") || t("login_staff_contact_owner")}{" "}
          {t("login_staff_contact_owner")}
        </>
      );
    }
    if (code === "STAFF_INACTIVE") {
      return wrap(
        <>
          {t("login_staff_inactive")} {t("login_staff_contact_owner")}
        </>
      );
    }
    if (code === "INVALID_CREDENTIAL") {
      return wrap(
        <>
          {t("login_staff_bad_password")} {t("login_staff_contact_owner")}
        </>
      );
    }
    if (code === "SHOP_NOT_FOUND") {
      return wrap(
        <>
          {t("login_staff_shop_not_found")} {t("login_staff_contact_owner")}
        </>
      );
    }
    return wrap(
      <>
        {t("common:errors.9000")} {t("login_staff_contact_owner")}
      </>
    );
  }

  return wrap(t("common:errors.9000"));
}
