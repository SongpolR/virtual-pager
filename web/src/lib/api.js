// web/src/lib/api.js
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

const api = axios.create({
  baseURL: API_BASE,
});

// Attach token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Global 401 handler → fire "session-expired" event
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const path = error?.response?.config?.url || "";

    // Ignore 401 only for login API
    const isLoginEndpoint = path.includes("/auth/login");

    if (status === 401 && !isLoginEndpoint) {
      // Clear session anyway
      localStorage.removeItem("token");
      localStorage.removeItem("user");

      // Notify React
      window.dispatchEvent(new Event("session-expired"));
    }

    return Promise.reject(error);
  }
);

export default api;
