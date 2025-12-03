// web/src/main.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import {
  createBrowserRouter,
  RouterProvider,
  Navigate,
} from "react-router-dom";
import "./index.css";
import "./i18n";

// Pages
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

function TopNav({ role }) {
  const { t } = useTranslation("common");

  return (
    <header className="w-full bg-white border-b border-gray-200 mb-4">
      <div className="mx-auto max-w-5xl px-4 py-3 flex items-center justify-between">
        <div className="font-semibold text-sm sm:text-base">
          {t("app_name")}
        </div>
        <nav className="flex items-center gap-4 text-sm">
          <a
            href="/orders"
            className="text-gray-700 hover:text-black underline-offset-4 hover:underline"
          >
            {t("menu.order_menu")}
          </a>
          {role === "owner" && (
            <a
              href="/settings/shop"
              className="text-gray-700 hover:text-black underline-offset-4 hover:underline"
            >
              {t("menu.shop_setting_menu")}
            </a>
          )}
          <a
            href="/settings/account"
            className="text-gray-700 hover:text-black underline-offset-4 hover:underline"
          >
            {t("menu.account_setting_menu")}
          </a>

          <LanguageSwitcher />
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
    location.href = "/login";
    return null;
  }

  return (
    <div className="relative min-h-screen bg-gray-50">
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
