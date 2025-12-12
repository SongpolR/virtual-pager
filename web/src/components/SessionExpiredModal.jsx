// web/src/components/SessionExpiredModal.jsx
import React from "react";
import { useTranslation } from "react-i18next";
import Dialog from "./Dialog";

export default function SessionExpiredModal({ open }) {
  const { t } = useTranslation("common");

  if (!open) return null;

  const handleOk = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("tokenType");
    localStorage.removeItem("user");
    window.location.href = "/login";
  };

  return (
    <Dialog
      open={open}
      onClose={null} // ❌ cannot close manually
      title={t("session_expired_title")}
      description={t("session_expired_message")}
      size="sm"
      closeOnBackdrop={false}
      closeOnEsc={false}
      showCloseButton={false}
      ariaLabelledById="session-expired-title"
      ariaDescribedById="session-expired-desc"
    >
      <div className="mt-2 flex justify-end">
        <button
          type="button"
          onClick={handleOk}
          className="
            inline-flex items-center justify-center
            rounded-full px-5 py-2 text-sm font-semibold
            bg-indigo-500 text-white
            shadow-md shadow-indigo-500/30
            transition
            hover:-translate-y-[1px] hover:bg-indigo-400
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300
            active:translate-y-0 active:scale-[0.98]
          "
        >
          {t("ok")}
        </button>
      </div>
    </Dialog>
  );
}
