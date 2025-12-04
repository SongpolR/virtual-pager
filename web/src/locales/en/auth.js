const auth = {
  // Auth / Login
  login: "Login",
  signup: "Sign up",
  or_signin: "Already have an account?",
  create_account: "Create account",
  sign_in_google: "Sign in with Google",
  reset_password: "Reset Password",
  activate: "Activate",
  deactivate: "Deactivate",
  verify_now: "Verify now",
  reset_password_here: "Reset password here",
  login_type_owner: "Owner",
  login_type_staff: "Staff",

  // Owner login error cases
  login_error_unverified: "Your email has not been verified.",
  login_error_bad_password: "Incorrect password.",
  login_error_no_account: "This email is not registered.",

  // Staff login error cases
  login_staff_not_found: "This email is not linked to any staff account.",
  login_staff_invite_pending: "Your staff account has not been activated yet.",
  login_staff_inactive: "This staff account is inactive.",
  login_staff_bad_password: "Incorrect password.",
  switch_to_owner_login: "Switch to Owner login",
  login_staff_contact_owner: "Please contact your shop owner to continue.",

  // Signup
  password_requirements_title: "Password requirements",
  password_rule_uppercase: "At least one uppercase letter",
  password_rule_number: "At least one number",
  password_rule_length: "At least 8 characters",
  password_rule_symbol: "At least one symbol: ! @ # $ % ^ & * . _ -",
  password_rule_match: "Password and confirmation password matched",
  password_confirm: "Confirm Password",
  password_requirements_error: "Password is not match with requirements",
  confirm_password_incorrect: "Confirm password is not match with requirements",
  signup_success:
    "Your account has been created successfully. Please verify your email address to complete your registration.",

  // Email verification
  verify_email_title: "Verify your email",
  verify_email_desc:
    "We’ve sent a verification link to your email. If you didn’t get it, you can resend it below.",
  link_sent:
    "If an account exists for this email, we have sent a new verification link.",
  resend_link: "Resend verification link",
  open_email_app: "Open email app",

  // Staff setup / reset
  staff_setup_title: "Activate Staff Account",
  staff_set_password: "Set password and activate",
  reset_link_sent: "Password reset link sent successfully.",
  invite_used: "This invite has already been used.",
  invite_invalid: "This invite link is invalid.",
  invite_expired: "This invite link has expired.",
  staff_reset_password_success: "Your password has been reset successfully.",
  staff_reset_invalid: "This reset link is invalid.",
  staff_reset_expired: "This reset link has expired.",

  reset_request_title: "Forgot your password?",
  reset_request_intro:
    "Enter your email address and we will send you a link to reset your password.",
  reset_request_submit: "Send reset link",
  reset_request_success:
    "If this email is registered, we have sent a password reset link.",
  forgot_password_link: "Forgot your password?",
  reset_password_title: "Reset your password",
  reset_password_cta: "Set new password",
  reset_password_success:
    "Your password has been reset successfully. Please continue on login page.",
};

export default auth;
