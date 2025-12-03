const customer = {
  shop: "Shop",
  shop_fallback: "Our shop",
  order_for_you: "This page shows your current order status in real time.",
  your_order: "Your order",
  order_no: "Order no. {{orderNo}}",
  status: "Status",
  items: "Items in your order",
  no_items: "No items found in this order.",
  total: "Total",
  currency: "THB",
  loading_order: "Loading your order...",
  sound_on: "Sound on",
  sound_muted: "Muted",
  footer_note: "If you need help, please show this screen to our staff.",

  status_hint: {
    default: "Please wait while we prepare your order.",
    preparing: "Your order is being prepared.",
    ready: "Your order is ready! Please pick it up at the counter.",
    done: "Your order has been completed.",
  },

  status_map: {
    // optional if you want a separate map; you can also reuse app-wide statuses
    pending: "Waiting",
    preparing: "Preparing",
    ready: "Ready",
    done: "Completed",
    cancelled: "Cancelled",
  },

  price_each: "{{price}} THB each",

  errors: {
    title: "Something went wrong",
    failed_to_load_order:
      "Unable to load your order. Please try refreshing the page.",
    order_not_found: "Order not found",
    check_code: "Please check your order link or QR code and try again.",
    help_text: "If this keeps happening, please contact the shop staff.",
  },
};

export default customer;
