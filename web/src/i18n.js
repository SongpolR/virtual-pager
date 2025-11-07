// web/src/i18n.js
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

const resources = {
  en: {
    translation: {
      // ===== Common labels =====
      app_title: "Virtual Pager",
      health_ok: "All systems are go",
      login_type_owner: "Owner",
      login_type_staff: "Staff",
      login: "Login",
      signup: "Sign up",
      or_signin: "Already have an account?",
      create_account: "Create account",
      your_name: "Your name",
      email: "Email",
      password: "Password",
      confirm_password: "Confirm password",
      shop_name: "Shop name",
      shop_logo: "Shop logo",
      preview: "Preview",
      sign_in_google: "Sign in with Google",
      email_address: "Email address",
      resend_link: "Resend verification link",
      open_email_app: "Open email app",
      back_to_login: "Back to Login",
      verify_now: "Verify now",
      reset_password: "Reset password",
      reset_password_success: "Reset password successfully, continue to login",
      continue_login: "Continue to login",
      set_password: "Set password",

      // ===== Field requirements / helper text =====
      field_requirements: "Requirements",
      logo_requirements_title: "Logo requirements",
      logo_req_size: "File size ≤ 2 MB",
      logo_req_resolution: "Resolution ≤ 1024×1024 px",
      logo_req_types: "PNG / JPG / JPEG",
      password_requirements_title: "Password requirements",
      pw_req_length: "At least 8 characters",
      pw_req_upper: "At least 1 uppercase letter (A–Z)",
      pw_req_number: "At least 1 number (0–9)",
      pw_req_chars:
        "Allowed characters: letters, numbers, ! @ # $ % ^ & * . _ -",
      pw_req_match: "Password and confirmation password matched",
      password_ok: "Password looks good!",
      invalid_image_file: "Invalid image file",
      logo_too_big: "Logo must be ≤ 2 MB",
      logo_too_large_resolution: "Logo must be ≤ 1024×1024 px",
      password_rule: "8+ chars, 1 uppercase, 1 number",

      // ===== Login inline error messages (owner mode) =====
      login_error_unverified: "Please verify your email to continue.",
      login_error_bad_password: "Incorrect password.",
      login_error_no_account: "We couldn't find an account with that email.",

      // ===== Login inline error messages (staff mode) =====
      login_staff_contact_owner: "Please contact your shop owner.",
      login_staff_not_found: "We couldn’t find a staff account for this email.",
      login_staff_inactive: "Your staff account is disabled.",
      login_staff_bad_password: "Incorrect password.",
      switch_to_owner_login: "Switch to Owner login",
      login_staff_invite_pending: "Your staff account is not activated yet.",

      // ===== Verify Email page =====
      verify_email_title: "Verify your email",
      verify_email_desc:
        "We’ve sent a verification link to your email. If you didn’t get it, you can resend it below.",
      link_sent:
        "If an account exists for this email, we have sent a new verification link.",

      // ===== Staff Setup (invite accept) =====
      staff_setup_title: "Set your password",
      staff_setup_desc: "Create a password to activate your staff account.",
      invite_invalid: "The invite link is invalid.",
      invite_expired: "The invite link has expired.",
      invite_used: "This invite link was already used.",

      // ===== Numeric error codes → user messages =====
      errors: {
        1000: "This field is required.",
        1001: "The format is invalid.",
        1002: "This email is already registered.",
        1003: "Invalid email or password.",
        1004: "Unauthorized request.",
        1005: "File is too large.",
        1006: "Image resolution is too high.",
        1007: "Account not found.",
        1100: "Google sign-in failed.",
        1101: "Google did not provide an email for this account.",
        1200: "Please verify your email to continue.",
        1201: "If an account exists for this email, we have sent a reset link.",
        1202: "This reset link is invalid.",
        1203: "This reset link has expired.",
        1300: "Your staff account is disabled.",
        1400: "Invalid invite.",
        1401: "Invite expired.",
        1402: "Invite already used.",
        1999: "An unexpected error occurred.",
      },
    },
  },

  th: {
    translation: {
      // ===== Common labels =====
      app_title: "เพจเจอร์เรียกคิว",
      health_ok: "ระบบพร้อมทำงาน",
      login_type_owner: "เจ้าของ",
      login_type_staff: "พนักงาน",
      login: "เข้าสู่ระบบ",
      signup: "สมัครสมาชิก",
      or_signin: "มีบัญชีอยู่แล้ว?",
      create_account: "สร้างบัญชี",
      your_name: "ชื่อของคุณ",
      email: "อีเมล",
      password: "รหัสผ่าน",
      confirm_password: "ยืนยันรหัสผ่าน",
      shop_name: "ชื่อร้าน",
      shop_logo: "โลโก้ร้าน",
      preview: "ตัวอย่าง",
      sign_in_google: "เข้าสู่ระบบด้วย Google",
      email_address: "ที่อยู่อีเมล",
      resend_link: "ส่งลิงก์ยืนยันอีกครั้ง",
      open_email_app: "เปิดแอปอีเมล",
      back_to_login: "กลับสู่หน้าเข้าสู่ระบบ",
      verify_now: "ยืนยันตอนนี้",
      reset_password: "รีเซ็ตรหัสผ่าน",
      reset_password_success: "รีเซ็ตรหัสผ่านสำเร็จ, กลับไปเข้าสู่ระบบ",
      continue_login: "กลับไปเข้าสู่ระบบ",
      set_password: "ตั้งรหัสผ่าน",

      // ===== Field requirements / helper text =====
      field_requirements: "ข้อกำหนด",
      logo_requirements_title: "ข้อกำหนดโลโก้",
      logo_req_size: "ขนาดไฟล์ ≤ 2 MB",
      logo_req_resolution: "ความละเอียด ≤ 1024×1024 พิกเซล",
      logo_req_types: "รองรับ PNG / JPG / JPEG",
      password_requirements_title: "ข้อกำหนดรหัสผ่าน",
      pw_req_length: "อย่างน้อย 8 ตัวอักษร",
      pw_req_upper: "มีตัวพิมพ์ใหญ่อย่างน้อย 1 ตัว (A–Z)",
      pw_req_number: "มีตัวเลขอย่างน้อย 1 ตัว (0–9)",
      pw_req_chars: "อักขระที่อนุญาต: A–Z a–z 0–9 และ ! @ # $ % ^ & * . _ -",
      pw_req_match: "รหัสผ่านและรหัสผ่านที่ยืนยันตรงกัน",
      password_ok: "รหัสผ่านผ่านข้อกำหนดทั้งหมดแล้ว!",
      invalid_image_file: "ไฟล์รูปภาพไม่ถูกต้อง",
      logo_too_big: "โลโก้ต้องมีขนาด ≤ 2 MB",
      logo_too_large_resolution: "โลโก้ต้องมีความละเอียด ≤ 1024×1024 พิกเซล",
      password_rule: "อย่างน้อย 8 ตัว มีตัวพิมพ์ใหญ่และตัวเลข",

      // ===== Login inline error messages (owner mode) =====
      login_error_unverified: "กรุณายืนยันอีเมลก่อนจึงจะใช้งานต่อได้",
      login_error_bad_password: "รหัสผ่านไม่ถูกต้อง",
      login_error_no_account: "ไม่พบบัญชีที่ใช้อีเมลนี้",

      // ===== Login inline error messages (staff mode) =====
      login_staff_contact_owner: "โปรดติดต่อเจ้าของร้านของคุณ",
      login_staff_not_found: "ไม่พบบัญชีพนักงานสำหรับอีเมลนี้",
      login_staff_inactive: "บัญชีพนักงานของคุณถูกปิดใช้งาน",
      login_staff_bad_password: "รหัสผ่านไม่ถูกต้อง",
      switch_to_owner_login: "สลับไปเข้าสู่ระบบเจ้าของร้าน",
      login_staff_invite_pending: "บัญชีพนักงานของคุณยังไม่ได้เปิดใช้งาน",

      // ===== Verify Email page =====
      verify_email_title: "ยืนยันอีเมลของคุณ",
      verify_email_desc:
        "เราได้ส่งลิงก์ยืนยันไปยังอีเมลของคุณ หากยังไม่ได้รับ คุณสามารถส่งอีกครั้งได้ด้านล่าง",
      link_sent: "ถ้ามีบัญชีนี้อยู่ เราได้ส่งลิงก์ยืนยันใหม่ให้แล้ว",

      // ===== Staff Setup (invite accept) =====
      staff_setup_title: "ตั้งรหัสผ่านของคุณ",
      staff_setup_desc: "สร้างรหัสผ่านเพื่อเปิดใช้งานบัญชีพนักงานของคุณ",
      invite_invalid: "ลิงก์คำเชิญไม่ถูกต้อง",
      invite_expired: "ลิงก์คำเชิญหมดอายุ",
      invite_used: "ลิงก์คำเชิญถูกใช้งานแล้ว",

      // ===== Numeric error codes → user messages =====
      errors: {
        1000: "จำเป็นต้องกรอกข้อมูล",
        1001: "รูปแบบข้อมูลไม่ถูกต้อง",
        1002: "อีเมลนี้ถูกใช้งานแล้ว",
        1003: "อีเมลหรือรหัสผ่านไม่ถูกต้อง",
        1004: "ไม่มีสิทธิ์เข้าถึง",
        1005: "ไฟล์มีขนาดใหญ่เกินไป",
        1006: "ความละเอียดของรูปภาพสูงเกินไป",
        1007: "ไม่พบบัญชีผู้ใช้",
        1100: "ไม่สามารถเข้าสู่ระบบด้วย Google ได้",
        1101: "บัญชี Google นี้ไม่มีอีเมลแนบมา",
        1200: "กรุณายืนยันอีเมลก่อนใช้งานต่อ",
        1201: "ถ้ามีบัญชีอีเมลนี้ เราได้ส่งลิงก์รีเซ็ตรหัสผ่านให้แล้ว",
        1202: "ลิงก์รีเซ็ตรหัสผ่านไม่ถูกต้อง",
        1203: "ลิงก์รีเซ็ตรหัสผ่านหมดอายุ",
        1300: "บัญชีพนักงานของคุณถูกปิดใช้งาน",
        1400: "คำเชิญไม่ถูกต้อง",
        1401: "คำเชิญหมดอายุ",
        1402: "คำเชิญถูกใช้งานแล้ว",
        1999: "เกิดข้อผิดพลาดที่ไม่คาดคิด",
      },
    },
  },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: "en",
    detection: {
      order: ["localStorage", "navigator"],
      caches: ["localStorage"],
    },
    interpolation: { escapeValue: false },
  });

export default i18n;
