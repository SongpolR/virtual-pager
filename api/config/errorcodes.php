<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Standardized API Error Codes
    |--------------------------------------------------------------------------
    | Each error is a unique integer to make frontend mapping simple.
    | All controllers should return JSON like:
    | {
    |   "message": "error message",
    |   "errors": [1003]
    | }
    | The frontend will map these to localized i18n messages.
    |--------------------------------------------------------------------------
    */

    // ----- General -----
    'UNKNOWN'             => 1999,
    'VALIDATION_ERROR'    => 1000,
    'INVALID_FORMAT'      => 1001,
    'EMAIL_EXISTS'        => 1002,
    'INVALID_CREDENTIAL'  => 1003,
    'UNAUTHORIZED'        => 1004,
    'FILE_TOO_LARGE'      => 1005,
    'IMAGE_TOO_LARGE'     => 1006,
    'ACCOUNT_NOT_FOUND'   => 1007,

    // ----- Google Login -----
    'GOOGLE_FAILED'       => 1100,
    'GOOGLE_NO_EMAIL'     => 1101,

    // ----- Email Verification / Reset -----
    'EMAIL_NOT_VERIFIED'  => 1200,
    'RESET_SENT'          => 1201,
    'RESET_INVALID'       => 1202,
    'RESET_EXPIRED'       => 1203,

    // ----- Staff-specific -----
    'STAFF_INACTIVE'      => 1300,

    // ----- Staff Invite -----
    'INVITE_INVALID'      => 1400,
    'INVITE_EXPIRED'      => 1401,
    'INVITE_USED'         => 1402,
    'INVITE_PENDING'      => 1403
];
