<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Standardized API Error Codes (Virtual Pager)
    |--------------------------------------------------------------------------
    |
    | We use 4-digit numeric codes, grouped by leading digit:
    |   1xxx = Validation / input
    |   2xxx = Auth / session / login (incl. Google)
    |   3xxx = Email verification & password reset
    |   4xxx = Staff & invite
    |   5xxx = Shop / account / tables / pagers
    |   6xxx = Orders
    |   7xxx = Integrations (POS, webhooks, external APIs)
    |   8xxx = Platform / system / limits
    |   9xxx = Generic / fallback
    |
    | Typical response patterns:
    |
    | 1) Validation (per field):
    | {
    |   "success": false,
    |   "message": "VALIDATION_FAILED",
    |   "errors": {
    |     "email": [
    |       { "code": 1006, "meta": {} }
    |     ]
    |   }
    | }
    |
    | 2) Non-validation / global errors:
    | {
    |   "success": false,
    |   "message": "SESSION_EXPIRED",
    |   "errors": {}
    | }
    |
    | Frontend (React) will map:
    |   t(`errors.${code}`) or t(`validation.${code}`)
    | with i18n.
    |--------------------------------------------------------------------------
    */

    // --------------------------------------------------
    // 1xxx – Validation / Input
    // --------------------------------------------------

    'VALIDATION_ERROR'       => 1000, // generic fallback for validation

    'REQUIRED_FIELD'         => 1001, // required
    'INVALID_EMAIL'          => 1002, // email
    'INVALID_FORMAT'         => 1003, // regex or generic format
    'TOO_SHORT'              => 1004, // min
    'TOO_LONG'               => 1005, // max
    'VALUE_OUT_OF_RANGE'     => 1006, // min/max combined or numeric out of range
    'INVALID_ENUM'           => 1007, // not in allowed set

    'INVALID_FILE_TYPE'      => 1008, // wrong mime / extension
    'FILE_TOO_LARGE'         => 1009, // exceeds file size
    'INVALID_IMAGE'          => 1010, // not a valid image
    'IMAGE_TOO_LARGE'        => 1011, // resolution or megapixel over limit

    'EMAIL_TAKEN'            => 1012, // unique: email
    'USERNAME_TAKEN'         => 1013, // unique: username (future)
    'PHONE_TAKEN'            => 1014, // unique: phone (future)

    'PASSWORD_TOO_WEAK'      => 1015, // fails strength rules
    'PASSWORD_REUSE'         => 1016, // same as old password

    'INVALID_DATE_RANGE'     => 1017, // start > end
    'INVALID_TIME_RANGE'     => 1018, // time range invalid
    'INVALID_ORDER_FILTER'   => 1019, // bad filter params (date/status)

    'PASSWORD_NOT_SAME'      => 1020, // not same

    // --------------------------------------------------
    // 2xxx – Auth / Session / Login / Google
    // --------------------------------------------------

    'INVALID_CREDENTIAL'     => 2000, // wrong email/password
    'UNAUTHORIZED'           => 2001, // not logged in / missing token
    'FORBIDDEN'              => 2002, // logged in but not allowed
    'SESSION_EXPIRED'        => 2003, // token expired → triggers session modal
    'TOKEN_INVALID'          => 2004,
    'TOKEN_EXPIRED'          => 2005,
    'TOKEN_MISSING'          => 2006,

    'ACCOUNT_NOT_FOUND'      => 2007,
    'ACCOUNT_INACTIVE'       => 2008,
    'ACCOUNT_LOCKED'         => 2009,

    'OWNER_ONLY'             => 2010, // route requires owner (not staff)

    // 21xx – Google login specific
    'GOOGLE_LOGIN_FAILED'    => 2100,
    'GOOGLE_TOKEN_INVALID'   => 2101,
    'GOOGLE_NO_EMAIL'        => 2102,
    'GOOGLE_EMAIL_MISMATCH'  => 2103,

    // --------------------------------------------------
    // 3xxx – Email Verification & Password Reset
    // --------------------------------------------------

    'EMAIL_NOT_VERIFIED'     => 3000,
    'EMAIL_ALREADY_VERIFIED' => 3001,

    'VERIFY_TOKEN_INVALID'   => 3002,
    'VERIFY_TOKEN_EXPIRED'   => 3003,

    'RESET_EMAIL_SENT'       => 3004, // can be used as a success code in data/message
    'RESET_TOKEN_INVALID'    => 3005,
    'RESET_TOKEN_EXPIRED'    => 3006,

    // --------------------------------------------------
    // 4xxx – Staff & Invites
    // --------------------------------------------------

    'STAFF_NOT_FOUND'        => 4000,
    'STAFF_INACTIVE'         => 4001,
    'STAFF_ALREADY_EXISTS'   => 4002,
    'STAFF_ROLE_INVALID'     => 4003,
    'STAFF_LIMIT_REACHED'    => 4004, // max staff per shop reached

    'INVITE_INVALID'         => 4100,
    'INVITE_EXPIRED'         => 4101,
    'INVITE_USED'            => 4102,
    'INVITE_PENDING'         => 4103,

    // --------------------------------------------------
    // 5xxx – Shop / Account / Settings / Tables / Pagers
    // --------------------------------------------------

    // Shop & account
    'SHOP_NOT_FOUND'         => 5000,
    'SHOP_INACTIVE'          => 5001,
    'SHOP_LIMIT_REACHED'     => 5002,
    'SHOP_LOGO_TOO_LARGE'    => 5003, // business rule (resolution/file size)
    'SHOP_TIMEZONE_INVALID'  => 5004,

    'ACCOUNT_EMAIL_EXISTS'   => 5005, // when changing email
    'ACCOUNT_PASSWORD_INVALID' => 5006, // current password incorrect
    'SETTING_READ_ONLY'      => 5007, // attempting to change locked system setting
    'SOUND_KEY_INVALID'      => 5008, // invalid bell sound key

    // Tables
    'TABLE_NOT_FOUND'        => 5100,
    'TABLE_INACTIVE'         => 5101,
    'TABLE_NUMBER_EXISTS'    => 5102,
    'TABLE_LIMIT_REACHED'    => 5103,

    // Pagers (physical / virtual mapping)
    'PAGER_NOT_FOUND'        => 5200,
    'PAGER_ALREADY_ASSIGNED' => 5201,
    'PAGER_OFFLINE'          => 5202,
    'PAGER_SIGNAL_FAILED'    => 5203,

    // --------------------------------------------------
    // 6xxx – Orders
    // --------------------------------------------------

    'ORDER_NOT_FOUND'        => 6000,
    'ORDER_INVALID_TRANSITION' => 6001, // bad state change
    'ORDER_ALREADY_COMPLETED' => 6002,
    'ORDER_ALREADY_CANCELLED' => 6003,
    'ORDER_TOO_OLD_TO_MODIFY' => 6004,

    'ORDER_NUMBERING_FAILED' => 6005,
    'ORDER_TABLE_MISMATCH'   => 6006, // table/order link invalid
    'ORDER_ITEM_INVALID'     => 6007, // invalid items payload
    'ORDER_LIMIT_REACHED'    => 6008, // rate/volume constraint

    'ORDER_POS_ID_CONFLICT'  => 6009, // duplicate POS order id
    'ORDER_NOT_OWNED_BY_SHOP' => 6010, // access order of other shop

    // --------------------------------------------------
    // 7xxx – Integrations / POS / Webhooks / External APIs
    // --------------------------------------------------

    'POS_PAYLOAD_INVALID'    => 7000,
    'POS_SIGNATURE_INVALID'  => 7001,
    'POS_ORDER_ID_CONFLICT'  => 7002,
    'POS_SHOP_MISMATCH'      => 7003,
    'POS_RATE_LIMITED'       => 7004,

    'WEBHOOK_DISABLED'       => 7010,
    'WEBHOOK_SIGNATURE_INVALID' => 7011,
    'WEBHOOK_ENDPOINT_ERROR' => 7012,

    // --------------------------------------------------
    // 8xxx – Platform / System / Limits
    // --------------------------------------------------

    'RATE_LIMITED'           => 8000,
    'MAINTENANCE_MODE'       => 8001,
    'SERVICE_UNAVAILABLE'    => 8002,
    'DEPENDENCY_FAILED'      => 8003, // e.g. DB / cache / mail provider
    'CONFIG_INVALID'         => 8004,
    'ENVIRONMENT_MISCONFIGURED' => 8005,

    // --------------------------------------------------
    // 9xxx – Generic / Fallback
    // --------------------------------------------------

    'UNKNOWN'                => 9000,
    'INTERNAL_ERROR'         => 9001,
    'NOT_IMPLEMENTED'        => 9002,
    'NOT_FOUND'              => 9003, // generic resource not found
];
