import React from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import "./index.css";
import Staff from "./pages/Staff.jsx";
import Customer from "./pages/Customer.jsx";

const router = createBrowserRouter([
  { path: "/", element: <Staff /> },
  { path: "/customer/:orderNo", element: <Customer /> },
]);

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
