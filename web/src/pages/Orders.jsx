// web/src/pages/Orders.jsx
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { QRCodeCanvas } from "qrcode.react";
import api from "../lib/api";
import { useToast } from "../components/ToastProvider";
import LoadingSpinner from "../components/LoadingSpinner";
import { getGlobalErrorFromAxios } from "../lib/errorHelpers";
import RefreshIcon from "../components/icons/RefreshIcon.jsx";

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
    } catch (err) {
      const data = err?.response?.data;
      const code =
        data && Array.isArray(data.errors) && data.errors.length
          ? data.errors[0]
          : null;
      if (code === 1500) {
        showToast({
          type: "error",
          message: t("order_invalid_transition"),
        });
      } else if (code === 1501) {
        showToast({
          type: "error",
          message: t("order_not_found"),
        });
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

    return (
      <div className="mt-2 space-y-1">
        {order.items.map((it, idx) => {
          const qty = it.qty ?? 1;
          const name = it.name || t("order_item_unnamed") || "Item";
          const note = it.note?.trim();

          return (
            <div
              key={idx}
              className="flex items-center gap-2 rounded-md bg-slate-50 px-2 py-1 dark:bg-slate-900/70"
            >
              {/* Qty pill */}
              <span className="mt-0.5 inline-flex h-5 min-w-[2rem] items-center justify-center rounded-full bg-slate-100 text-[10px] font-semibold text-slate-800 dark:bg-slate-800 dark:text-slate-100">
                {qty}×
              </span>

              {/* Name + note chip */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1">
                  <span className="truncate text-[11px] font-semibold text-slate-900 dark:text-slate-50">
                    {name}
                  </span>
                </div>
                {note && (
                  <div className="mt-0.5 inline-flex max-w-full items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] text-amber-700 dark:bg-amber-900/40 dark:text-amber-200">
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
    <div className="mt-4 space-y-4 text-slate-900 dark:text-slate-100 overflow-x-hidden">
      {/* Header row */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold sm:text-2xl">
            {t("orders_title") || "Orders"}
          </h1>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {t("orders_subtitle") ||
              "Manage incoming orders and update their status in real time."}
          </p>
        </div>
      </div>

      {/* Create order */}
      <div className="app-card-surface mb-4 rounded-2xl border shadow-sm shadow-slate-900/5 dark:shadow-slate-900/40">
        <div className="border-b border-slate-100 px-4 pb-3 pt-3.5 text-sm font-semibold text-slate-800 dark:border-slate-800 dark:text-slate-100">
          {t("order_create_title") || "Create order"}
        </div>
        <form
          onSubmit={handleCreate}
          className="flex flex-col gap-4 px-4 pb-4 pt-3"
        >
          {/* Basic info */}
          <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-end">
            <div className="w-full sm:flex-1">
              <label className="mb-1 block text-[11px] font-medium text-slate-600 dark:text-slate-300">
                {t("order_no_label") || "Order No. (optional)"}
              </label>
              <input
                type="text"
                className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 focus:ring-offset-slate-100 dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:ring-offset-slate-900"
                value={orderNo}
                onChange={(e) => setOrderNo(e.target.value)}
                placeholder={t("order_no_placeholder") || "e.g. A-101"}
              />
            </div>
            <div className="w-full sm:flex-1">
              <label className="mb-1 block text-[11px] font-medium text-slate-600 dark:text-slate-300">
                {t("pos_ref_label") || "POS Ref (optional)"}
              </label>
              <input
                type="text"
                className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 focus:ring-offset-slate-100 dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:ring-offset-slate-900"
                value={posRef}
                onChange={(e) => setPosRef(e.target.value)}
                placeholder={t("pos_ref_placeholder") || "e.g. POS-2025-0001"}
              />
            </div>
            <button
              type="submit"
              disabled={creating}
              className="w-full whitespace-nowrap rounded-full bg-indigo-500 px-4 py-2 text-sm font-medium text-white shadow-md shadow-indigo-500/40 transition hover:-translate-y-[1px] hover:bg-indigo-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300 active:translate-y-0 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            >
              {creating
                ? t("order_creating") || "Creating..."
                : t("order_create_button") || "Create"}
            </button>
          </div>

          {/* Items section */}
          <div className="w-full rounded-xl border border-dashed border-slate-200 bg-slate-50/80 p-3 dark:border-slate-700 dark:bg-slate-900/60">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                {t("order_items_title") || "Order items"}
              </h3>
              <button
                type="button"
                onClick={addItemRow}
                className="rounded-full border border-slate-300 bg-white px-2 py-1 text-[11px] font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
              >
                + {t("add_item") || "Add item"}
              </button>
            </div>

            <div className="space-y-2">
              {items.map((it, idx) => (
                <div
                  key={idx}
                  className="flex flex-col gap-1 rounded-xl bg-white/90 p-2 text-xs shadow-sm ring-1 ring-slate-100 dark:bg-slate-900/80 dark:ring-slate-700 sm:grid sm:grid-cols-[minmax(0,3fr)_minmax(0,1fr)_minmax(0,3fr)_auto] sm:items-center sm:gap-2"
                >
                  <input
                    type="text"
                    className="w-full rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-900 placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500"
                    value={it.name}
                    onChange={(e) =>
                      handleItemChange(idx, "name", e.target.value)
                    }
                    placeholder={
                      t("order_item_name_placeholder") || "e.g. Pad Thai"
                    }
                  />
                  <div className="flex items-center gap-1 sm:gap-2">
                    <span className="text-[11px] text-slate-500 sm:hidden">
                      {t("qty_label") || "Qty"}
                    </span>
                    <input
                      type="number"
                      min={1}
                      className="w-20 rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-900 focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                      value={it.qty}
                      onChange={(e) =>
                        handleItemChange(idx, "qty", e.target.value)
                      }
                    />
                  </div>
                  <input
                    type="text"
                    className="w-full rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-900 placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500"
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
                    className="mt-1 inline-flex items-center justify-center rounded-full border border-red-300 px-2 py-1 text-[11px] font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-red-500/60 dark:text-red-200 dark:hover:bg-red-950/40 sm:mt-0"
                  >
                    {t("common:remove") || "Remove"}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </form>
      </div>

      {/* Orders columns / board */}
      <>
        {/* Mobile: tabbed layout (one column at a time) */}
        <div className="mb-3 md:hidden">
          <div className="flex overflow-hidden rounded-full border border-slate-200 bg-slate-100 text-xs dark:border-slate-700 dark:bg-slate-900/80">
            <button
              type="button"
              onClick={() => setMobileStatus("pending")}
              className={[
                "flex-1 px-3 py-2 font-medium transition",
                mobileStatus === "pending"
                  ? "bg-indigo-500 text-white shadow-inner"
                  : "text-slate-700 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-800",
              ].join(" ")}
            >
              {t("order_status_pending") || "Pending"}{" "}
              <span className="ml-1 text-[10px] text-slate-200 dark:text-slate-400">
                ({pendingOrders.length})
              </span>
            </button>
            <button
              type="button"
              onClick={() => setMobileStatus("ready")}
              className={[
                "flex-1 border-l border-slate-200 px-3 py-2 font-medium transition dark:border-slate-700",
                mobileStatus === "ready"
                  ? "bg-indigo-500 text-white shadow-inner"
                  : "text-slate-700 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-800",
              ].join(" ")}
            >
              {t("order_status_ready") || "Ready"}{" "}
              <span className="ml-1 text-[10px] text-slate-200 dark:text-slate-400">
                ({readyOrders.length})
              </span>
            </button>
            <button
              type="button"
              onClick={() => setMobileStatus("done")}
              className={[
                "flex-1 border-l border-slate-200 px-3 py-2 font-medium transition dark:border-slate-700",
                mobileStatus === "done"
                  ? "bg-indigo-500 text-white shadow-inner"
                  : "text-slate-700 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-800",
              ].join(" ")}
            >
              {t("order_status_done") || "Done"}{" "}
              <span className="ml-1 text-[10px] text-slate-200 dark:text-slate-400">
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
        <div className="hidden gap-4 md:grid md:grid-cols-3">
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

      {/* Floating refresh button */}
      <button
        type="button"
        onClick={loadOrders}
        className="
    fixed bottom-4 right-4 z-40 flex items-center justify-center
    rounded-full shadow-lg shadow-indigo-500/40 transition
    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300
    active:translate-y-0 active:scale-[0.97]

    /* --- Mobile (icon-only circular button) --- */
    h-12 w-12 bg-indigo-500 hover:bg-indigo-400 sm:h-auto sm:w-auto

    /* --- Desktop (icon + text pill button) --- */
    sm:flex sm:flex-row sm:gap-2 sm:rounded-full sm:px-4 sm:py-2 sm:text-sm sm:font-medium
    text-white
  "
      >
        <RefreshIcon size={18} className="text-white" />

        {/* Text label only on sm+ */}
        <span className="hidden sm:inline">{t("refresh") || "Refresh"}</span>
      </button>

      {/* Large QR Modal */}
      {qrModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setQrModalOpen(false)}
        >
          <div
            className="w-full max-w-xs rounded-2xl bg-white p-4 text-slate-900 shadow-2xl shadow-slate-900/40 dark:bg-slate-900 dark:text-slate-50"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col items-center gap-3">
              <QRCodeCanvas
                value={qrOrderUrl}
                size={260}
                className="rounded-md bg-white dark:bg-slate-50"
              />
              <div className="px-1 text-center text-[10px] text-slate-500 break-all dark:text-slate-400">
                <a
                  href={qrOrderUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline underline-offset-2"
                >
                  {qrOrderUrl}
                </a>
              </div>
              <button
                onClick={() => setQrModalOpen(false)}
                className="mt-1 w-full rounded-full bg-slate-900 px-4 py-2 text-xs font-medium text-white shadow-sm hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 dark:bg-slate-50 dark:text-slate-900 dark:hover:bg-slate-200"
              >
                {t("close") || "Close"}
              </button>
            </div>
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
    <div className="app-card-surface flex min-h-[160px] w-full flex-col rounded-2xl border shadow-sm shadow-slate-900/5 dark:shadow-slate-900/40">
      <div className="flex items-center justify-between border-b border-slate-100 px-3 py-2.5 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
        <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
          {title}
        </h3>
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-600 dark:bg-slate-900 dark:text-slate-300">
          {orders.length}
        </span>
      </div>

      {orders.length === 0 ? (
        <div className="flex flex-1 items-center justify-center py-4 text-xs text-slate-400 dark:text-slate-500">
          {t("orders_empty") || "No orders"}
        </div>
      ) : (
        <div className="max-h-[320px] space-y-3 overflow-y-auto p-2 sm:max-h-[360px]">
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
                className="cursor-pointer rounded-xl bg-slate-50 p-2 text-xs text-slate-800 shadow-sm ring-1 ring-slate-100 transition hover:-translate-y-[1px] hover:shadow-md hover:ring-indigo-200 dark:bg-slate-900/80 dark:text-slate-100 dark:ring-slate-700 dark:hover:bg-slate-900 dark:hover:ring-indigo-500/60"
              >
                <div className="mb-1 flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    {/* Main order number: #001 */}
                    <div className="text-xl font-extrabold text-slate-900 dark:text-slate-50">
                      #{o.order_no}
                    </div>
                    {/* Created time + POS ref */}
                    <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                      {createdAtLabel && (
                        <span className="flex items-center gap-1">
                          <span>🕒</span>
                          <span>{createdAtLabel}</span>
                        </span>
                      )}
                      {o.pos_ref && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-600 dark:bg-slate-800 dark:text-slate-200">
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
                      className="cursor-pointer rounded bg-white dark:bg-slate-50"
                      onClick={() => onShowQr && onShowQr(customerUrl)}
                    />

                    <a
                      href={customerUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[9px] text-slate-400 underline underline-offset-2 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 break-all"
                    >
                      {t("open_customer_page") || "Open page"}
                    </a>
                  </div>
                </div>

                {renderItemsSummary(o)}

                <div className="mt-2 flex flex-wrap justify-end gap-2">
                  {onReady && (
                    <button
                      onClick={() => onReady(o)}
                      className="rounded-full border border-sky-400 px-2 py-1 text-[11px] font-medium text-sky-600 hover:bg-sky-50 dark:border-sky-500/70 dark:text-sky-200 dark:hover:bg-sky-950/40"
                    >
                      {t("mark_ready") || "Mark ready"}
                    </button>
                  )}
                  {onDone && (
                    <button
                      onClick={() => onDone(o)}
                      className="rounded-full border border-emerald-400 px-2 py-1 text-[11px] font-medium text-emerald-600 hover:bg-emerald-50 dark:border-emerald-500/70 dark:text-emerald-200 dark:hover:bg-emerald-950/40"
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
