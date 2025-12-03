// web/src/i18n.js
import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import enCommon from "./locales/en/common";
import enAuth from "./locales/en/auth";
import enOrders from "./locales/en/orders";
import enShopSettings from "./locales/en/shop_settings";
import enAccount from "./locales/en/account";
import enCustomer from "./locales/en/customer";

import thCommon from "./locales/th/common";
import thAuth from "./locales/th/auth";
import thOrders from "./locales/th/orders";
import thShopSettings from "./locales/th/shop_settings";
import thAccount from "./locales/th/account";
import thCustomer from "./locales/th/customer";

const savedLang = localStorage.getItem("lang") || "en";

i18n.use(initReactI18next).init({
  lng: savedLang,
  fallbackLng: "en",
  interpolation: { escapeValue: false },

  ns: ["common", "auth", "orders", "shop_settings", "account", "customer"],
  defaultNS: "common",

  resources: {
    en: {
      common: enCommon,
      auth: enAuth,
      orders: enOrders,
      shop_settings: enShopSettings,
      account: enAccount,
      customer: enCustomer,
    },
    th: {
      common: thCommon,
      auth: thAuth,
      orders: thOrders,
      shop_settings: thShopSettings,
      account: thAccount,
      customer: thCustomer,
    },
  },
});

export default i18n;
