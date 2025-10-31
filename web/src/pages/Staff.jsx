import React, { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";

const API = import.meta.env.VITE_API_URL || "http://localhost:8000/api";
const FRONTEND = import.meta.env.VITE_FRONTEND_URL || "http://localhost:5173";

export default function Staff() {
  const [orders, setOrders] = useState([]);

  const load = async () => {
    const res = await fetch(`${API}/orders`);
    const data = await res.json();
    setOrders(data);
  };

  const add = async () => {
    await fetch(`${API}/orders`, { method: "POST" });
    load();
  };

  const mark = async (orderNo, state) => {
    await fetch(`${API}/orders/${orderNo}/${state}`, { method: "POST" });
    load();
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">🧑‍🍳 XOLA Café – Staff Pager</h1>
        <button
          onClick={add}
          className="px-3 py-2 rounded-xl bg-green-600 text-white hover:bg-green-700"
        >
          ➕ New order
        </button>
      </div>

      <div className="mt-6 grid gap-4">
        {orders.map((o) => {
          const url = `${FRONTEND}/customer/${encodeURIComponent(o.order_no)}`;
          return (
            <div
              key={o.id}
              className="bg-white rounded-xl p-4 shadow flex items-center justify-between"
            >
              <div>
                <div className="text-lg font-bold">Order #{o.order_no}</div>
                <div className="text-gray-600">Status: {o.status}</div>
                <div className="mt-2 flex gap-2">
                  <button
                    onClick={() => mark(o.order_no, "ready")}
                    className="px-3 py-1.5 rounded bg-amber-600 text-white hover:bg-amber-700"
                  >
                    🔔 Notify (READY)
                  </button>
                  <button
                    onClick={() => mark(o.order_no, "done")}
                    className="px-3 py-1.5 rounded bg-slate-700 text-white hover:bg-slate-800"
                  >
                    ✅ Done
                  </button>
                </div>
              </div>
              <div className="flex flex-col items-center">
                <QRCodeSVG value={url} size={110} />
                <a
                  className="mt-2 text-sm text-blue-600 hover:underline"
                  href={url}
                  target="_blank"
                >
                  Open customer link
                </a>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
