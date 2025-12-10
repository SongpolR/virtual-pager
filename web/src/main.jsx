// web/src/main.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import "./i18n";
import Login from "./pages/Login.jsx";
import Signup from "./pages/Signup.jsx";
import VerifyEmail from "./pages/VerifyEmail.jsx";
import StaffSetup from "./pages/StaffSetup.jsx";
import StaffReset from "./pages/StaffReset.jsx";
import Orders from "./pages/Orders.jsx";
import ShopSettings from "./pages/ShopSettings.jsx";
import AccountSettings from "./pages/AccountSettings.jsx";
import NotFound from "./pages/NotFound.jsx";
import LanguageSwitcher from "./components/LanguageSwitcher.jsx";
import SessionExpiredModal from "./components/SessionExpiredModal";
import { ToastProvider } from "./components/ToastProvider";
import { useTranslation } from "react-i18next";
import Customer from "./pages/Customer.jsx";
import ForgotPassword from "./pages/ForgotPassword.jsx";
import ResetPassword from "./pages/ResetPassword.jsx";
import ThemeSwitcher from "./components/ThemeSwitcher.jsx";
import {
  createBrowserRouter,
  RouterProvider,
  Navigate,
  Link,
  NavLink,
} from "react-router-dom";
import HamburgerIcon from "./components/icons/HamburgerIcon.jsx";
import CloseIcon from "./components/icons/CloseIcon.jsx";

function TopNav({ role }) {
  const { t } = useTranslation("common");
  const [open, setOpen] = React.useState(false);

  const toggleMenu = () => setOpen((prev) => !prev);
  const closeMenu = () => setOpen(false);

  return (
    <header className="mb-4 w-full border-b border-slate-200 bg-white/90 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/90">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        {/* ---------- App Icon + Name (Responsive) ---------- */}
        <Link
          to="/orders"
          className="group flex items-center gap-2 rounded px-1 py-1 sm:px-2 sm:py-2 light:bg-indigo-400/5"
          onClick={closeMenu}
        >
          <div className="relative h-8 w-8">
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

          {/* Show app name only on sm+ to avoid overflow */}
          <span className="sm:inline text-base font-semibold text-slate-800 dark:text-slate-100">
            {t("app_name")}
          </span>
        </Link>

        {/* ---------- Desktop Navigation ---------- */}
        <nav className="hidden items-center gap-4 text-sm md:flex">
          <NavLink
            to="/orders"
            className={({ isActive }) =>
              [
                "rounded-full px-3 py-1 transition-colors",
                isActive
                  ? "bg-slate-900/5 text-indigo-600 dark:bg-slate-100/10 dark:text-indigo-300 font-semibold"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-50",
              ].join(" ")
            }
          >
            {t("menu.order_menu")}
          </NavLink>

          {role === "owner" && (
            <NavLink
              to="/settings/shop"
              className={({ isActive }) =>
                [
                  "rounded-full px-3 py-1 transition-colors",
                  isActive
                    ? "bg-slate-900/5 text-indigo-600 dark:bg-slate-100/10 dark:text-indigo-300 font-semibold"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-50",
                ].join(" ")
              }
            >
              {t("menu.shop_setting_menu")}
            </NavLink>
          )}

          <NavLink
            to="/settings/account"
            className={({ isActive }) =>
              [
                "rounded-full px-3 py-1 transition-colors",
                isActive
                  ? "bg-slate-900/5 text-indigo-600 dark:bg-slate-100/10 dark:text-indigo-300 font-semibold"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-50",
              ].join(" ")
            }
          >
            {t("menu.account_setting_menu")}
          </NavLink>

          <div className="ml-1 flex items-center gap-2">
            <LanguageSwitcher />
            <ThemeSwitcher />
          </div>
        </nav>

        {/* ---------- Mobile: Hamburger ---------- */}
        <div className="flex items-center md:hidden">
          <button
            type="button"
            onClick={toggleMenu}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-700 shadow-sm transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
            aria-label="Toggle navigation menu"
            aria-expanded={open}
          >
            {open ? <CloseIcon size={18} /> : <HamburgerIcon size={18} />}
          </button>
        </div>
      </div>

      {/* ---------- Mobile Menu (Animated) ---------- */}
      <div
        className={`
          md:hidden overflow-hidden border-t border-slate-200 bg-white/95 dark:border-slate-800 dark:bg-slate-900/95
          transform origin-top transition-all duration-250 ease-out
          ${
            open
              ? "max-h-96 opacity-100 scale-y-100"
              : "pointer-events-none max-h-0 opacity-0 scale-y-95"
          }
        `}
      >
        <nav className="mx-auto flex max-w-5xl flex-col gap-2 px-4 py-3 text-sm">
          <NavLink
            to="/orders"
            onClick={closeMenu}
            className={({ isActive }) =>
              [
                "rounded-md px-2 py-2 transition-colors",
                isActive
                  ? "bg-indigo-100 text-indigo-700 font-medium dark:bg-indigo-900/40 dark:text-indigo-200"
                  : "text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800",
              ].join(" ")
            }
          >
            {t("menu.order_menu")}
          </NavLink>

          {role === "owner" && (
            <NavLink
              to="/settings/shop"
              onClick={closeMenu}
              className={({ isActive }) =>
                [
                  "rounded-md px-2 py-2 transition-colors",
                  isActive
                    ? "bg-indigo-100 text-indigo-700 font-medium dark:bg-indigo-900/40 dark:text-indigo-200"
                    : "text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800",
                ].join(" ")
              }
            >
              {t("menu.shop_setting_menu")}
            </NavLink>
          )}

          <NavLink
            to="/settings/account"
            onClick={closeMenu}
            className={({ isActive }) =>
              [
                "rounded-md px-2 py-2 transition-colors",
                isActive
                  ? "bg-indigo-100 text-indigo-700 font-medium dark:bg-indigo-900/40 dark:text-indigo-200"
                  : "text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800",
              ].join(" ")
            }
          >
            {t("menu.account_setting_menu")}
          </NavLink>

          {/* Preferences block */}
          <div className="mt-2 flex flex-col items-start justify-between rounded-lg bg-slate-50 px-3 py-2.5 dark:bg-slate-800/80">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              {t("menu.preferences_label") || "Preferences"}
            </span>
            <div className="mt-2 flex items-center gap-2">
              <ThemeSwitcher />
              <LanguageSwitcher />
            </div>
          </div>
        </nav>
      </div>
    </header>
  );
}

// Route guard wrapper
function Protected({ children, role }) {
  const token = localStorage.getItem("token");
  const tokenType = localStorage.getItem("tokenType"); // "owner" | "staff"

  if (!token || (role && tokenType !== role)) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="app-shell-bg relative min-h-screen text-slate-900 dark:text-slate-100">
      <TopNav role={tokenType} />
      <main className="mx-auto max-w-5xl px-4 pb-8">{children}</main>
    </div>
  );
}

// Router definition
const router = createBrowserRouter([
  // Redirect root → /orders
  { path: "/", element: <Navigate to="/orders" replace /> },

  // Public
  { path: "/login", element: <Login /> },
  { path: "/signup", element: <Signup /> },
  { path: "/verify-email", element: <VerifyEmail /> },
  { path: "/staff-setup", element: <StaffSetup /> },
  { path: "/staff-reset", element: <StaffReset /> },
  { path: "/customer/orders/:publicCode", element: <Customer /> },
  { path: "/forgot-password", element: <ForgotPassword /> },
  { path: "/reset-password", element: <ResetPassword /> },

  // Shared (owner + staff)
  {
    path: "/orders",
    element: (
      <Protected>
        <Orders />
      </Protected>
    ),
  },
  {
    path: "/settings/account",
    element: (
      <Protected>
        <AccountSettings />
      </Protected>
    ),
  },

  // Owner-only
  {
    path: "/settings/shop",
    element: (
      <Protected role="owner">
        <ShopSettings />
      </Protected>
    ),
  },

  // 404
  { path: "*", element: <NotFound /> },
]);

function AppRoot() {
  const [sessionExpired, setSessionExpired] = React.useState(false);

  React.useEffect(() => {
    const lang = localStorage.getItem("lang");
    if (lang) {
      import("./i18n").then(({ default: i18n }) => i18n.changeLanguage(lang));
    }
  }, []);

  React.useEffect(() => {
    const handleSessionExpired = () => {
      setSessionExpired(true);
    };

    window.addEventListener("session-expired", handleSessionExpired);
    return () => {
      window.removeEventListener("session-expired", handleSessionExpired);
    };
  }, []);

  return (
    <>
      {/* Global, highest-priority modal */}
      <SessionExpiredModal open={sessionExpired} />

      {/* Existing router */}
      <RouterProvider router={router} />
    </>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ToastProvider>
      <AppRoot />
    </ToastProvider>
  </React.StrictMode>
);
