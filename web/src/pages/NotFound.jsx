import React from "react";
import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-[420px] bg-white rounded-xl shadow p-6">
        <p className="mt-2 text-sm">
          This page will be implemented in the next step.
        </p>
        <Link className="underline mt-4 inline-block" to="/login">
          Back to Login
        </Link>
      </div>
    </div>
  );
}
