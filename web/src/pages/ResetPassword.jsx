import React from "react";

export default function ResetPassword() {
  const params = new URLSearchParams(location.search);
  const email = params.get("email") || "";
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-[420px] bg-white rounded-xl shadow p-6">
        <h1 className="text-xl font-semibold">Reset password</h1>
        <p className="mt-2 text-sm text-gray-600">Email: {email}</p>
        <p className="mt-2 text-sm">
          This page will be implemented in the next step.
        </p>
        <a className="underline mt-4 inline-block" href="/login">
          Back to Login
        </a>
      </div>
    </div>
  );
}
