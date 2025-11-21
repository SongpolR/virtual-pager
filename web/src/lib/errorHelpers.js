// web/src/lib/errorHelpers.js

/**
 * Map backend validation errors to a simple
 * { fieldName: "translated message" } shape.
 *
 * Expected backend format:
 * {
 *   success: false,
 *   message: "VALIDATION_FAILED",
 *   errors: {
 *     "email": [
 *       { code: 1006, meta: {} },
 *       ...
 *     ],
 *     "password": [
 *       { code: 1015, meta: { min: 8 } }
 *     ]
 *   }
 * }
 *
 * We assume a single i18n namespace: errors.<code>
 * where <code> is a number (1001) or string ("EMAIL_TAKEN").
 *
 * @param {object} apiErrors  data.errors from backend
 * @param {function} t        i18n translate function
 * @param {number|string} [fallbackCode=1000] default validation error code
 * @returns {Record<string, string>}
 */
export function mapFieldValidationErrors(apiErrors, t, fallbackCode = 1000) {
  if (!apiErrors || typeof apiErrors !== "object") return {};

  const fieldErrors = {};

  Object.entries(apiErrors).forEach(([field, items]) => {
    if (!Array.isArray(items) || items.length === 0) return;

    const first = items[0];

    // Support both object-style and simple codes:
    // - { code, meta }
    // - "1001"
    // - 1001
    let code;
    let meta = {};

    if (typeof first === "object" && first !== null && "code" in first) {
      code = first.code;
      meta = first.meta || {};
    } else {
      // simple style: ["1001", "1002"]
      code = first;
    }

    const key = `errors.${code}`;
    const translated =
      t(key, meta) !== key
        ? t(key, meta)
        : t(`errors.${fallbackCode}`) || "Invalid value";

    fieldErrors[field] = translated;
  });

  return fieldErrors;
}

/**
 * Extract a global error message from an Axios error response.
 * - Tries validation fallback if provided
 * - Tries message as a code: errors.MESSAGE_KEY
 * - Falls back to generic unknown / network error.
 */
export function getGlobalErrorFromAxios(err, t, options = {}) {
  const {
    defaultValidationCode = 1000,
    defaultUnknownCode = 9000,
    defaultNetworkCode = 9001,
  } = options;

  if (!err) return "";

  if (!err.response) {
    // Network error / no response
    const key = `errors.${defaultNetworkCode}`;
    return t(key) !== key ? t(key) : "Network error";
  }

  const { status, data } = err.response;

  // Validation (422) – caller can choose to show generic validation message
  if (status === 422) {
    const key = `errors.${defaultValidationCode}`;
    return t(key) !== key ? t(key) : "";
  }

  // If backend uses "message" as a code (e.g. SESSION_EXPIRED, INVALID_CREDENTIAL)
  if (data?.message) {
    const key = `errors.${data.message}`;
    if (t(key) !== key) return t(key);
  }

  // Fallback: generic unknown
  const key = `errors.${defaultUnknownCode}`;
  return t(key) !== key ? t(key) : "Unexpected error";
}
