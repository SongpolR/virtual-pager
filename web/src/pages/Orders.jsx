// web/src/pages/Orders.jsx
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { QRCodeCanvas } from "qrcode.react";
import api from "../lib/api";
import { useToast } from "../components/ToastProvider";
import LoadingSpinner from "../components/LoadingSpinner";
import { getGlobalErrorFromAxios } from "../lib/errorHelpers";
import { Link } from "react-router-dom";

// Base URL for customer-facing order page
const CUSTOMER_BASE_URL =
  import.meta.env.VITE_CUSTOMER_URL || window.location.origin;

export default function Orders() {
  const { t } = useTranslation("orders");
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);

  const [orders, setOrders] = useState([]);

  const [creating, setCreating] = useState(false);

  // create form
  const [orderNo, setOrderNo] = useState("");
  const [posRef, setPosRef] = useState("");
  const [items, setItems] = useState([{ name: "", qty: 1, note: "" }]);

  // mobile current status tab: 'pending' | 'ready' | 'done'
  const [mobileStatus, setMobileStatus] = useState("pending");

  // Large QR modal
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [qrOrderUrl, setQrOrderUrl] = useState("");

  const handleShowQr = (url) => {
    setQrOrderUrl(url);
    setQrModalOpen(true);
  };

  // ---- Load orders ----
  async function loadOrders() {
    setLoading(true);
    try {
      const res = await api.get("/orders");
      setOrders(res.data?.data ?? []);
    } catch (err) {
      if (err?.response?.status === 401) {
        return;
      }
      showToast({ type: "error", message: getGlobalErrorFromAxios(err, t) });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOrders();
  }, []);

  // ---- Items handlers ----
  const handleItemChange = (index, field, value) => {
    setItems((prev) => {
      const cloned = [...prev];
      cloned[index] = {
        ...cloned[index],
        [field]: field === "qty" ? Number(value) || 0 : value,
      };
      return cloned;
    });
  };

  const addItemRow = () => {
    setItems((prev) => [...prev, { name: "", qty: 1, note: "" }]);
  };

  const removeItemRow = (index) => {
    setItems((prev) => {
      const cloned = prev.filter((_, i) => i !== index);
      // always keep at least 1 row
      return cloned.length ? cloned : [{ name: "", qty: 1, note: "" }];
    });
  };

  // ---- Create order ----
  const handleCreate = async (e) => {
    e.preventDefault();
    setCreating(true);

    try {
      const body = {};
      if (orderNo.trim() !== "") body.order_no = orderNo.trim();
      if (posRef.trim() !== "") body.pos_ref = posRef.trim();

      // Clean items: keep only those with a name and qty > 0
      const cleanedItems = Array.isArray(items)
        ? items
            .map((it) => ({
              name: (it.name || "").trim(),
              qty: Number(it.qty) || 0,
              note: (it.note || "").trim(),
            }))
            .filter((it) => it.name !== "" && it.qty > 0)
        : [];

      // Items are optional, but if user filled some, send them
      if (cleanedItems.length > 0) {
        body.items = cleanedItems;
      }

      await api.post("/orders", body);

      showToast({ type: "success", message: t("order_created") });
      console.log(1123);
      setOrderNo("");
      setPosRef("");
      setItems([{ name: "", qty: 1, note: "" }]);
      // reload list
      loadOrders();
    } catch (err) {
      const data = err?.response?.data;
      const code =
        data && Array.isArray(data.errors) && data.errors.length
          ? data.errors[0]
          : null;
      if (code === 1502) {
        showToast({ type: "error", message: t("order_number_conflict") });
      } else {
        showToast({ type: "error", message: getGlobalErrorFromAxios(err, t) });
      }
    } finally {
      setCreating(false);
    }
  };

  // ---- Change status (ready/done) ----
  const changeStatus = async (order, targetStatus) => {
    const endpoint =
      targetStatus === "ready"
        ? `/orders/${order.id}/ready`
        : `/orders/${order.id}/done`;

    try {
      await api.post(endpoint);
      await loadOrders();
    } catch (e) {
      const data = err?.response?.data;
      const code =
        data && Array.isArray(data.errors) && data.errors.length
          ? data.errors[0]
          : null;
      if (code === 1500) {
        showToast({ type: "error", message: t("order_invalid_transition") });
      } else if (code === 1500) {
        showToast({ type: "error", message: t("order_not_found") });
      } else {
        showToast({ type: "error", message: getGlobalErrorFromAxios(err, t) });
      }
    }
  };

  // ---- Helpers to group orders ----
  const pendingOrders = orders.filter((o) => o.status === "pending");
  const readyOrders = orders.filter((o) => o.status === "ready");
  const doneOrders = orders.filter((o) => o.status === "done");

  // Fancy item view
  const renderItemsSummary = (order) => {
    if (!order.items || !Array.isArray(order.items) || !order.items.length) {
      return null;
    }

    const visibleItems = order.items.slice(0, 3);

    return (
      <div className="mt-2 space-y-1">
        {order.items.map((it, idx) => {
          const qty = it.qty ?? 1;
          const name = it.name || t("order_item_unnamed") || "Item";
          const note = it.note?.trim();

          return (
            <div
              key={idx}
              className="flex items-center gap-2 rounded-md bg-white px-2 py-1"
            >
              {/* Qty pill */}
              <span className="mt-0.5 inline-flex h-5 min-w-[2rem] items-center justify-center rounded-full bg-gray-100 text-[10px] font-semibold text-gray-800">
                {qty}×
              </span>

              {/* Name + note chip */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1">
                  <span className="truncate text-[11px] font-semibold text-gray-900">
                    {name}
                  </span>
                </div>
                {note && (
                  <div className="mt-0.5 inline-flex max-w-full items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] text-amber-700">
                    <span className="text-[9px]">●</span>
                    <span className="truncate">{note}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // Mobile: pick which list to show based on current tab
  const mobileOrders =
    mobileStatus === "pending"
      ? pendingOrders
      : mobileStatus === "ready"
      ? readyOrders
      : doneOrders;

  const mobileTitle =
    mobileStatus === "pending"
      ? t("order_status_pending") || "Pending"
      : mobileStatus === "ready"
      ? t("order_status_ready") || "Ready"
      : t("order_status_done") || "Done";

  if (loading) {
    return <LoadingSpinner fullscreen={true} label={t("loading")} />;
  }

  return (
    <div className="mt-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
        <h1 className="text-2xl font-bold">{t("orders_title") || "Orders"}</h1>
        <button
          type="button"
          onClick={loadOrders}
          className="self-start sm:self-auto text-xs border border-gray-300 rounded px-3 py-1 hover:bg-gray-100"
        >
          {t("refresh") || "Refresh"}
        </button>
      </div>

      {/* Create order */}
      <div className="bg-white rounded-xl shadow p-4 mb-6">
        <h2 className="text-lg font-semibold mb-2">
          {t("order_create_title") || "Create order"}
        </h2>
        <form onSubmit={handleCreate} className="flex flex-col gap-4">
          {/* Basic info */}
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-end">
            <div className="w-full sm:flex-1">
              <label className="block text-xs text-gray-600 mb-1">
                {t("order_no_label") || "Order No. (optional)"}
              </label>
              <input
                type="text"
                className="w-full border rounded px-2 py-1 text-sm"
                value={orderNo}
                onChange={(e) => setOrderNo(e.target.value)}
                placeholder={t("order_no_placeholder") || "e.g. A-101"}
              />
            </div>
            <div className="w-full sm:flex-1">
              <label className="block text-xs text-gray-600 mb-1">
                {t("pos_ref_label") || "POS Ref (optional)"}
              </label>
              <input
                type="text"
                className="w-full border rounded px-2 py-1 text-sm"
                value={posRef}
                onChange={(e) => setPosRef(e.target.value)}
                placeholder={t("pos_ref_placeholder") || "e.g. POS-2025-0001"}
              />
            </div>
            <button
              type="submit"
              disabled={creating}
              className="whitespace-nowrap bg-black text-white text-sm px-4 py-2 rounded hover:bg-gray-900 disabled:opacity-60 w-full sm:w-auto"
            >
              {creating
                ? t("order_creating") || "Creating..."
                : t("order_create_button") || "Create"}
            </button>
          </div>

          {/* Items section */}
          <div className="w-full border border-gray-200 rounded-lg p-3 bg-gray-50">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-semibold text-gray-700">
                {t("order_items_title") || "Order items"}
              </h3>
              <button
                type="button"
                onClick={addItemRow}
                className="text-[11px] px-2 py-1 border border-dashed border-gray-400 rounded hover:bg-white"
              >
                + {t("add_item") || "Add item"}
              </button>
            </div>

            <div className="space-y-2">
              {items.map((it, idx) => (
                <div
                  key={idx}
                  className="flex flex-col gap-1 sm:grid sm:grid-cols-[minmax(0,3fr)_minmax(0,1fr)_minmax(0,3fr)_auto] sm:items-center sm:gap-2"
                >
                  <input
                    type="text"
                    className="border rounded px-2 py-1 text-xs sm:text-sm w-full"
                    value={it.name}
                    onChange={(e) =>
                      handleItemChange(idx, "name", e.target.value)
                    }
                    placeholder={
                      t("order_item_name_placeholder") || "e.g. Pad Thai"
                    }
                  />
                  <div className="flex items-center gap-1 sm:gap-2">
                    <span className="text-[11px] text-gray-500 sm:hidden">
                      {t("qty_label") || "Qty"}
                    </span>
                    <input
                      type="number"
                      min={1}
                      className="border rounded px-2 py-1 text-xs sm:text-sm w-20"
                      value={it.qty}
                      onChange={(e) =>
                        handleItemChange(idx, "qty", e.target.value)
                      }
                    />
                  </div>
                  <input
                    type="text"
                    className="border rounded px-2 py-1 text-xs sm:text-sm w-full"
                    value={it.note}
                    onChange={(e) =>
                      handleItemChange(idx, "note", e.target.value)
                    }
                    placeholder={
                      t("order_item_note_placeholder") || "Note (optional)"
                    }
                  />
                  <button
                    type="button"
                    onClick={() => removeItemRow(idx)}
                    disabled={items.length === 1}
                    className="mt-1 sm:mt-0 text-[11px] px-2 py-1 border border-red-300 text-red-500 rounded hover:bg-red-50 disabled:opacity-40 self-start sm:self-auto"
                  >
                    {t("remove") || "Remove"}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </form>
      </div>

      {/* Orders columns / board */}
      {loading ? (
        <div className="text-gray-600 text-sm">{t("loading")}</div>
      ) : (
        <>
          {/* Mobile: tabbed layout (one column at a time) */}
          <div className="md:hidden mb-3">
            <div className="flex text-xs border border-gray-200 rounded-lg overflow-hidden">
              <button
                type="button"
                onClick={() => setMobileStatus("pending")}
                className={`flex-1 px-3 py-2 ${
                  mobileStatus === "pending"
                    ? "bg-black text-white"
                    : "bg-white text-gray-700"
                }`}
              >
                {t("order_status_pending") || "Pending"}{" "}
                <span className="ml-1 text-[10px] text-gray-300">
                  ({pendingOrders.length})
                </span>
              </button>
              <button
                type="button"
                onClick={() => setMobileStatus("ready")}
                className={`flex-1 px-3 py-2 border-l border-gray-200 ${
                  mobileStatus === "ready"
                    ? "bg-black text-white"
                    : "bg-white text-gray-700"
                }`}
              >
                {t("order_status_ready") || "Ready"}{" "}
                <span className="ml-1 text-[10px] text-gray-300">
                  ({readyOrders.length})
                </span>
              </button>
              <button
                type="button"
                onClick={() => setMobileStatus("done")}
                className={`flex-1 px-3 py-2 border-l border-gray-200 ${
                  mobileStatus === "done"
                    ? "bg-black text-white"
                    : "bg-white text-gray-700"
                }`}
              >
                {t("order_status_done") || "Done"}{" "}
                <span className="ml-1 text-[10px] text-gray-300">
                  ({doneOrders.length})
                </span>
              </button>
            </div>
          </div>

          <div className="md:hidden">
            <OrderColumn
              title={mobileTitle}
              orders={mobileOrders}
              t={t}
              onReady={
                mobileStatus === "pending"
                  ? (o) => changeStatus(o, "ready")
                  : null
              }
              onDone={
                mobileStatus === "ready" ? (o) => changeStatus(o, "done") : null
              }
              renderItemsSummary={renderItemsSummary}
              onShowQr={handleShowQr}
            />
          </div>

          {/* Desktop / tablet: 3-column board */}
          <div className="hidden md:grid gap-4 md:grid-cols-3">
            {/* Pending */}
            <OrderColumn
              title={t("order_status_pending") || "Pending"}
              orders={pendingOrders}
              t={t}
              onReady={(o) => changeStatus(o, "ready")}
              onDone={null}
              renderItemsSummary={renderItemsSummary}
              onShowQr={handleShowQr}
            />

            {/* Ready */}
            <OrderColumn
              title={t("order_status_ready") || "Ready"}
              orders={readyOrders}
              t={t}
              onReady={null}
              onDone={(o) => changeStatus(o, "done")}
              renderItemsSummary={renderItemsSummary}
              onShowQr={handleShowQr}
            />

            {/* Done */}
            <OrderColumn
              title={t("order_status_done") || "Done"}
              orders={doneOrders}
              t={t}
              onReady={null}
              onDone={null}
              renderItemsSummary={renderItemsSummary}
              onShowQr={handleShowQr}
            />
          </div>
        </>
      )}

      {/* Large QR Modal (always outside responsive wrappers) */}
      {qrModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setQrModalOpen(false)}
        >
          <div
            className="bg-white rounded-xl shadow-xl p-4 w-full max-w-xs flex flex-col items-center gap-3"
            onClick={(e) => e.stopPropagation()}
          >
            <QRCodeCanvas
              value={qrOrderUrl}
              size={260}
              className="rounded-md"
            />
            <div className="text-xs text-gray-600 break-all text-center px-1">
              <Link
                to={qrOrderUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[9px] text-gray-400 underline"
              >
                {qrOrderUrl}
              </Link>
            </div>
            <button
              onClick={() => setQrModalOpen(false)}
              className="mt-2 bg-black text-white text-xs px-4 py-2 rounded hover:bg-gray-900 w-full"
            >
              {t("close") || "Close"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function OrderColumn({
  title,
  orders,
  t,
  onReady,
  onDone,
  renderItemsSummary,
  onShowQr,
}) {
  return (
    <div className="bg-white rounded-xl shadow p-3 min-h-[160px] flex flex-col">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold">{title}</h3>
        <span className="text-xs text-gray-400">{orders.length}</span>
      </div>

      {orders.length === 0 ? (
        <div className="flex-1 text-xs text-gray-400 flex items-center justify-center py-4">
          {t("orders_empty") || "No orders"}
        </div>
      ) : (
        <div className="space-y-3 overflow-y-auto max-h-[320px] sm:max-h-[360px] p-2">
          {orders.map((o) => {
            const createdAt = o.created_at ? new Date(o.created_at) : null;
            const createdAtLabel = createdAt
              ? `${createdAt.toLocaleDateString("th-TH", {
                  day: "2-digit",
                  month: "short",
                })} • ${createdAt.toLocaleTimeString("th-TH", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}`
              : null;

            const customerUrl = `${CUSTOMER_BASE_URL}/orders/${o.public_code}`;

            return (
              <div
                key={o.id}
                className="rounded-lg p-2 text-xs text-gray-800 bg-gray-50 shadow hover:shadow-md cursor-pointer"
              >
                <div className="flex justify-between items-start mb-1 gap-2">
                  <div className="min-w-0 flex-1">
                    {/* Main order number: #001 */}
                    <div className="text-sm font-extrabold text-gray-900">
                      #{o.order_no}
                    </div>
                    {/* Created time + POS ref */}
                    <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-gray-500">
                      {createdAtLabel && (
                        <span className="flex items-center gap-1">
                          <span>🕒</span>
                          <span>{createdAtLabel}</span>
                        </span>
                      )}
                      {o.pos_ref && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] text-gray-600">
                          <span className="font-semibold">POS</span>
                          <span className="truncate">{o.pos_ref}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Customer QR + actions */}
                  <div className="flex flex-col items-end gap-1">
                    <QRCodeCanvas
                      value={customerUrl}
                      size={52}
                      className="cursor-pointer"
                      onClick={() => onShowQr && onShowQr(customerUrl)}
                    />

                    <Link
                      to={customerUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[9px] text-gray-400 underline"
                    >
                      {t("open_customer_page") || "Open page"}
                    </Link>
                  </div>
                </div>

                {renderItemsSummary(o)}

                <div className="mt-2 flex flex-wrap gap-2 justify-end">
                  {onReady && (
                    <button
                      onClick={() => onReady(o)}
                      className="border border-blue-500 text-blue-600 px-2 py-1 rounded hover:bg-blue-50 text-[11px]"
                    >
                      {t("mark_ready") || "Mark ready"}
                    </button>
                  )}
                  {onDone && (
                    <button
                      onClick={() => onDone(o)}
                      className="border border-green-500 text-green-600 px-2 py-1 rounded hover:bg-green-50 text-[11px]"
                    >
                      {t("mark_done") || "Mark done"}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
