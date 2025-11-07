import React from "react";

export default function ChecklistItem({ ok, label }) {
  return (
    <li
      className={`flex items-start gap-2 ${
        ok ? "text-green-700" : "text-gray-600"
      }`}
    >
      <span>{ok ? "✅" : "⏺️"}</span>
      <span>{label}</span>
    </li>
  );
}
