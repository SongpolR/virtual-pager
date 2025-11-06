<?php
return [
  // Signup
  'REQUIRED_FIELD'     => 1000,
  'INVALID_FORMAT'     => 1001,
  'EMAIL_TAKEN'        => 1002,
  'INVALID_CREDENTIAL' => 1003,
  'UNAUTHORIZED'       => 1004,
  'FILE_TOO_LARGE'     => 1005,
  'IMAGE_TOO_LARGE'    => 1006,
  'ACCOUNT_NOT_FOUND'  => 1007,
  
  // Login
  'OAUTH_FAILED'       => 1100,
  'OAUTH_NO_EMAIL'     => 1101,

  // Email
  'EMAIL_NOT_VERIFIED' => 1200,
  'RESET_EMAIL_SENT'   => 1201, // (not an error—useful for message mapping if desired)
  'RESET_TOKEN_INVALID'=> 1202,
  'RESET_TOKEN_EXPIRED'=> 1203,

  'UNKNOWN'            => 1999,
];
