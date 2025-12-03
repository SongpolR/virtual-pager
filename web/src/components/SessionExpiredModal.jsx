// web/src/components/SessionExpiredModal.jsx
import React from "react";
import { useTranslation } from "react-i18next";

function SessionExpiredModal({ open }) {
  const { t } = useTranslation("common");
  if (!open) return null;

  const handleOk = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/login";
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60"
      aria-modal="true"
      role="dialog"
    >
      <div className="bg-white rounded-lg shadow-lg max-w-sm w-full mx-4 p-6">
        <h2 className="text-lg font-semibold mb-3">
          {t("session_expired_title")}
        </h2>

        <p className="text-sm text-gray-700 mb-6">
          {t("session_expired_message")}
        </p>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleOk}
            className="px-4 py-2 rounded-md bg-blue-600 text-white text-sm font-medium hover:bg-blue-700"
          >
            {t("ok")}
          </button>
        </div>
      </div>
    </div>
  );
}

export default SessionExpiredModal;
