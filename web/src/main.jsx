import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import "./index.css";
import "./i18n"; // initialize i18n before rendering

// ---------- Pages ----------
import Login from "./pages/Login.jsx";
import Signup from "./pages/Signup.jsx";
import VerifyEmail from "./pages/VerifyEmail.jsx";
import StaffSetup from "./pages/StaffSetup.jsx";
import StaffReset from "./pages/StaffReset.jsx";
import Dashboard from "./pages/Dashboard.jsx"; // owner dashboard
import StaffDashboard from "./pages/StaffDashboard.jsx"; // staff dashboard
import NotFound from "./pages/NotFound.jsx";

// ---------- i18n + UI Helpers ----------
import { useTranslation } from "react-i18next";

// Optional: simple language switch button on every page
function LangSwitcher() {
  const { i18n } = useTranslation();
  const toggle = () => {
    const next = i18n.language === "en" ? "th" : "en";
    i18n.changeLanguage(next);
    localStorage.setItem("lang", next);
  };
  return (
    <button
      onClick={toggle}
      className="absolute top-4 right-4 text-xs underline text-gray-600 hover:text-black"
    >
      {i18n.language === "en" ? "ไทย" : "EN"}
    </button>
  );
}

// ---------- Route Guards ----------
function Protected({ children, role }) {
  const token = localStorage.getItem("token");
  const tokenType = localStorage.getItem("tokenType"); // "owner" | "staff"
  if (!token || (role && tokenType !== role)) {
    location.href = "/login";
    return null;
  }
  return (
    <div className="relative min-h-screen bg-gray-50">
      <LangSwitcher />
      {children}
    </div>
  );
}

// ---------- Router ----------
const router = createBrowserRouter([
  // Public
  {
    path: "/",
    element: (
      <Protected role="owner">
        <Dashboard />
      </Protected>
    ),
  },
  { path: "/login", element: <Login /> },
  { path: "/signup", element: <Signup /> },
  { path: "/verify-email", element: <VerifyEmail /> },

  // Staff
  {
    path: "/staff",
    element: (
      <Protected role="staff">
        <StaffDashboard />
      </Protected>
    ),
  },
  { path: "/staff-setup", element: <StaffSetup /> },
  { path: "/staff-reset", element: <StaffReset /> },

  // Fallback
  { path: "*", element: <NotFound /> },
]);

// ---------- Root App ----------
function AppRoot() {
  React.useEffect(() => {
    // apply persisted language
    const lang = localStorage.getItem("lang");
    if (lang)
      import("./i18n").then(({ default: i18n }) => i18n.changeLanguage(lang));
  }, []);

  return <RouterProvider router={router} />;
}

// ---------- Render ----------
ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AppRoot />
  </React.StrictMode>
);
