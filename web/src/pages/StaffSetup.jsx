// web/src/pages/StaffSetup.jsx
import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import ChecklistItem from "../components/ChecklistItem.jsx";
import api from "../lib/api.js";
import {
  mapFieldValidationErrors,
  getGlobalErrorFromAxios,
} from "../lib/errorHelpers.js";
import { useNavigate, Link } from "react-router-dom";
import { useToast } from "../components/ToastProvider.jsx";
import AuthLayout from "../components/layout/AuthLayout.jsx";
import CopyIcon from "../components/icons/CopyIcon.jsx";

const pwOk = (pw) => ({
  length: pw.length >= 8,
  upper: /[A-Z]/.test(pw),
  number: /[0-9]/.test(pw),
  allowed: /[!@#$%^&*._-]/.test(pw),
});

export default function StaffSetup() {
  const { t } = useTranslation("auth");
  const navigate = useNavigate();
  const { showToast } = useToast();

  const params = new URLSearchParams(location.search);
  const tokenParam = params.get("token") || "";
  const email = params.get("email") || "";
  const shopCode = params.get("shop_code") || "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // lock submit when invite is not usable
  const [inviteBlock, setInviteBlock] = useState(null); // 'invalid' | 'expired' | 'used' | null

  const checks = useMemo(() => pwOk(password), [password]);
  const allPwOk =
    password &&
    checks.length &&
    checks.upper &&
    checks.number &&
    checks.allowed;

  const match = password && confirm && password === confirm;

  const updateFieldError = (field) => {
    setFieldErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const handlePasswordChange = (value) => {
    setPassword(value);
    updateFieldError("password");
    if (inviteBlock) setInviteBlock(null);
  };

  const handleConfirmChange = (value) => {
    setConfirm(value);
    if (inviteBlock) setInviteBlock(null);
  };

  const toastInviteBlock = (code) => {
    if (code === "INVITE_INVALID") {
      setInviteBlock("invalid");
      showToast({
        type: "error",
        message:
          t("invite_invalid") ||
          "This invite link is not valid. Please ask the owner to resend the invitation.",
      });
      return;
    }
    if (code === "INVITE_EXPIRED") {
      setInviteBlock("expired");
      showToast({
        type: "warning",
        message:
          t("invite_expired") ||
          "This invite link has expired. Please ask the owner to resend the invitation.",
      });
      return;
    }
    if (code === "INVITE_USED") {
      setInviteBlock("used");
      showToast({
        type: "info",
        message:
          t("invite_used") ||
          "This invite has already been used. Please login with your staff account.",
      });
      return;
    }

    // fallback: errors.<CODE> or generic
    const key = `errors.${code}`;
    const msg = t(key) !== key ? t(key) : t("errors.9000");
    showToast({ type: "error", message: msg });
  };

  const submit = async (e) => {
    e.preventDefault();

    setFieldErrors({});
    setInviteBlock(null);

    // Guard
    if (!tokenParam || !email) {
      showToast({
        type: "error",
        message:
          t("invite_invalid") ||
          "This invite link is not valid. Please ask the owner to resend the invitation.",
      });
      setInviteBlock("invalid");
      return;
    }

    setSubmitting(true);

    try {
      const res = await api.post("/staff/accept", {
        email,
        token: tokenParam,
        password,
        confirm_password: confirm,
      });

      const data = res.data;

      if (data?.success) {
        const apiToken = data.data?.token ?? data.token;
        if (apiToken) {
          localStorage.setItem("token", apiToken);
          localStorage.setItem("tokenType", "staff");
        }

        showToast({
          type: "success",
          message: t("staff_setup_success") || "Staff account activated.",
        });

        navigate(`/login?mode=staff&email=${email}&shop_code=${shopCode}`, {
          replace: true,
        });
        return;
      }

      if (data?.message) {
        toastInviteBlock(data.message);
        return;
      }

      showToast({ type: "error", message: t("errors.9000") });
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
        toastInviteBlock(data.message);
        return;
      }

      showToast({ type: "error", message: getGlobalErrorFromAxios(err, t) });
    } finally {
      setSubmitting(false);
    }
  };

  const subtitle =
    t("staff_setup_subtitle") ||
    "Set your password to activate your staff account";

  const copyShopCode = async () => {
    if (!shopCode) return;

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shopCode);
      } else {
        // fallback
        const ta = document.createElement("textarea");
        ta.value = shopCode;
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
        message: t("shop_settings:shop_code_copied") || "Copied",
      });
    } catch (e) {
      showToast({
        type: "error",
        message: t("shop_settings:shop_code_copy_failed") || "Copy failed",
      });
    }
  };

  return (
    <AuthLayout title={t("staff_setup_title")} subtitle={subtitle}>
      <form onSubmit={submit}>
        {/* Email pill */}
        {email && (
          <div className="mb-3 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-200">
            <span className="text-slate-500 dark:text-slate-400">
              {t("common:email") || "Email"}:
            </span>{" "}
            <span className="font-mono font-bold">{email}</span>
          </div>
        )}

        {shopCode && (
          <div className="mb-3 flex items-center justify-between gap-3 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-200">
            <div>
              <div className="min-w-0">
                <span className="text-slate-500 dark:text-slate-400">
                  {t("common:shop_code") || "Shop code"}:
                </span>{" "}
                <span className="font-mono font-bold break-all">
                  {shopCode}
                </span>
              </div>
              <div className="mt-3 text-start text-[11px] text-slate-500 dark:text-slate-400">
                {t("shop_settings:shop_code_staff_hint") ||
                  "This code is used for staff login."}
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
        )}

        {/* Password */}
        <div className="mt-2">
          <label className="mb-1 block text-[11px] font-medium text-slate-600 dark:text-slate-300">
            {t("common:password") || "Password"}
          </label>
          <input
            type="password"
            className={[
              "w-full rounded-lg border p-2.5 text-sm",
              "bg-white text-slate-900 placeholder:text-slate-400",
              "focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 focus:ring-offset-slate-100",
              "dark:bg-slate-900/80 dark:text-slate-100 dark:placeholder:text-slate-500",
              "dark:focus:ring-offset-slate-900",
              fieldErrors.password
                ? "border-red-500 focus:ring-red-500"
                : "border-slate-300 dark:border-slate-700",
            ].join(" ")}
            value={password}
            onChange={(e) => handlePasswordChange(e.target.value)}
            required
            autoComplete="new-password"
          />
          {fieldErrors.password && (
            <div className="mt-1 text-xs text-red-500 dark:text-red-400">
              {fieldErrors.password}
            </div>
          )}
        </div>

        {/* Confirm */}
        <div className="mt-4">
          <label className="mb-1 block text-[11px] font-medium text-slate-600 dark:text-slate-300">
            {t("common:confirm_password") || "Confirm password"}
          </label>
          <input
            type="password"
            className={[
              "w-full rounded-lg border p-2.5 text-sm",
              "bg-white text-slate-900 placeholder:text-slate-400",
              "focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 focus:ring-offset-slate-100",
              "dark:bg-slate-900/80 dark:text-slate-100 dark:placeholder:text-slate-500",
              "dark:focus:ring-offset-slate-900",
              fieldErrors.confirm_password
                ? "border-red-500 focus:ring-red-500"
                : "border-slate-300 dark:border-slate-700",
            ].join(" ")}
            value={confirm}
            onChange={(e) => handleConfirmChange(e.target.value)}
            required
            autoComplete="new-password"
          />
          {fieldErrors.confirm_password && (
            <div className="mt-1 text-xs text-red-500 dark:text-red-400">
              {fieldErrors.confirm_password}
            </div>
          )}
        </div>

        {/* Requirements */}
        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50/70 p-3 dark:border-slate-700 dark:bg-slate-900/60">
          <div className="text-xs font-semibold text-slate-700 dark:text-slate-200">
            {t("password_requirements_title") || "Password requirements"}
          </div>
          <ul className="mt-2 space-y-1 text-xs">
            <ChecklistItem
              ok={checks.length}
              label={t("password_rule_length")}
            />
            <ChecklistItem
              ok={checks.upper}
              label={t("password_rule_uppercase")}
            />
            <ChecklistItem
              ok={checks.number}
              label={t("password_rule_number")}
            />
            <ChecklistItem
              ok={checks.allowed}
              label={t("password_rule_symbol")}
            />
            <ChecklistItem ok={match} label={t("password_rule_match")} />
          </ul>
        </div>

        {/* CTA */}
        <button
          disabled={!allPwOk || !match || submitting || !!inviteBlock}
          className={[
            "mt-6 flex w-full items-center justify-center rounded-full px-4 py-2.5 text-sm font-medium text-white",
            "bg-indigo-500 shadow-lg shadow-indigo-500/40 transition",
            "hover:-translate-y-[1px] hover:bg-indigo-400 active:translate-y-0 active:scale-[0.99]",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300",
            "disabled:cursor-not-allowed disabled:opacity-60",
          ].join(" ")}
        >
          {t("staff_set_password")}
        </button>

        {/* Footer hint + optional link */}
        <div className="mt-3 text-center text-xs text-slate-500 dark:text-slate-400">
          {t("staff_setup_footer_hint") ||
            "This setup link is personal and should not be shared."}
          {inviteBlock === "used" && (
            <div className="mt-6">
              <Link
                to={{
                  pathname: "/login",
                  search: `?mode=staff&email=${encodeURIComponent(
                    email
                  )}&shop_code=${encodeURIComponent(shopCode)}`,
                }}
                state={{ from: "shop_settings" }}
                replace
              >
                {t("common:back_to_login")}
              </Link>
            </div>
          )}
        </div>
      </form>
    </AuthLayout>
  );
}
