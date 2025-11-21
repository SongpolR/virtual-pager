// web/src/components/SessionExpiredModal.jsx
import React from "react";

function SessionExpiredModal({ open }) {
  if (!open) return null;

  const handleOk = () => {
    // เผื่อมีอะไรตกค้าง
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    // redirect กลับหน้า login
    window.location.href = "/login";
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60"
      aria-modal="true"
      role="dialog"
    >
      <div className="bg-white rounded-lg shadow-lg max-w-sm w-full mx-4 p-6">
        <h2 className="text-lg font-semibold mb-3">Session expired</h2>
        <p className="text-sm text-gray-700 mb-6">
          Your session has expired. Please log in again to continue.
        </p>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleOk}
            className="px-4 py-2 rounded-md bg-blue-600 text-white text-sm font-medium hover:bg-blue-700"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
}

export default SessionExpiredModal;
