import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

const resources = {
  en: {
    translation: {
      app_title: "Virtual Pager",
      health_ok: "All systems are go",

      // Auth / Signup
      signup: "Sign up",
      login: "Sign in",
      logout: "Sign out",
      your_name: "Your name",
      email: "Email",
      password: "Password",
      shop_name: "Shop name",
      shop_logo: "Shop logo (≤2MB, ≤1024×1024)",
      create_account: "Create your account",
      invalid_login: "Invalid login",
      password_rule: "Min 8, 1 uppercase, 1 number. Allowed: !@#$%^&*._-",
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
      preview: "Preview",
      invalid_image_file: "Invalid image file",
      logo_too_big: "Logo must be ≤ 2 MB",
      logo_too_large_resolution: "Logo must be ≤ 1024×1024 px",
      sign_in_google: "Sign in with Google",
      verify_email_title: "Verify your email",
      verify_email_desc:
        "We’ve sent a verification link to your email. If you didn’t get it, you can resend it below.",
      email_address: "Email address",
      resend_link: "Resend verification link",
      link_sent:
        "If an account exists for this email, we have sent a new verification link.",
      open_email_app: "Open email app",
      back_to_login: "Back to Login",
      verify_now: "Verify now",
      login_error_unverified: "Please verify your email to continue.",
      login_error_bad_password: "Incorrect password.",
      login_error_no_account: "We couldn't find an account with that email.",
      // links:
      verify_now: "Verify now",
      reset_password: "Reset password",
      create_account: "Create account",

      errors: {
        1000: "This field is required.",
        1001: "The format is invalid.",
        1002: "This email is already registered.",
        1003: "Invalid email or password.",
        1004: "Unauthorized request.",
        1005: "File is too large.",
        1006: "Image resolution is too high.",
        1100: "Google sign-in failed.",
        1101: "Google did not provide an email for this account.",
        1200: "Please verify your email to continue.",
        1201: "If an account exists for this email, we have sent a reset link.",
        1202: "This reset link is invalid.",
        1203: "This reset link has expired.",
        1999: "An unexpected error occurred.",
      },

      // Misc
      or_signin: "Or",
    },
  },
  th: {
    translation: {
      app_title: "เพจเจอร์เรียกคิว",
      health_ok: "ระบบพร้อมทำงาน",

      signup: "สมัครสมาชิก",
      login: "เข้าสู่ระบบ",
      logout: "ออกจากระบบ",
      your_name: "ชื่อของคุณ",
      email: "อีเมล",
      password: "รหัสผ่าน",
      shop_name: "ชื่อร้าน",
      shop_logo: "โลโก้ร้าน (≤2MB, ≤1024×1024)",
      create_account: "สร้างบัญชีของคุณ",
      invalid_login: "เข้าสู่ระบบไม่สำเร็จ",
      password_rule:
        "อย่างน้อย 8 ตัว มีตัวพิมพ์ใหญ่ 1 ตัว ตัวเลข 1 ตัว อนุญาต !@#$%^&*._-",
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
      preview: "ตัวอย่าง",
      invalid_image_file: "ไฟล์รูปภาพไม่ถูกต้อง",
      logo_too_big: "โลโก้ต้องมีขนาด ≤ 2 MB",
      logo_too_large_resolution: "โลโก้ต้องมีความละเอียด ≤ 1024×1024 พิกเซล",
      sign_in_google: "เข้าสู่ระบบด้วย Google",
      verify_email_title: "ยืนยันอีเมลของคุณ",
      verify_email_desc:
        "เราได้ส่งลิงก์ยืนยันไปยังอีเมลของคุณ หากยังไม่ได้รับ คุณสามารถส่งอีกครั้งได้ด้านล่าง",
      email_address: "อีเมล",
      resend_link: "ส่งลิงก์ยืนยันอีกครั้ง",
      link_sent: "ถ้ามีบัญชีนี้อยู่ เราได้ส่งลิงก์ยืนยันใหม่ให้แล้ว",
      open_email_app: "เปิดแอปอีเมล",
      back_to_login: "กลับสู่หน้าเข้าสู่ระบบ",
      verify_now: "ยืนยันตอนนี้",
      login_error_unverified: "กรุณายืนยันอีเมลก่อนจึงจะใช้งานต่อได้",
      login_error_bad_password: "รหัสผ่านไม่ถูกต้อง",
      login_error_no_account: "ไม่พบบัญชีที่ใช้อีเมลนี้",
      verify_now: "ยืนยันตอนนี้",
      reset_password: "รีเซ็ตรหัสผ่าน",
      create_account: "สร้างบัญชี",

      errors: {
        1000: "จำเป็นต้องกรอกข้อมูล",
        1001: "รูปแบบข้อมูลไม่ถูกต้อง",
        1002: "อีเมลนี้ถูกใช้งานแล้ว",
        1003: "อีเมลหรือรหัสผ่านไม่ถูกต้อง",
        1004: "ไม่มีสิทธิ์เข้าถึง",
        1005: "ไฟล์มีขนาดใหญ่เกินไป",
        1006: "ความละเอียดของรูปภาพสูงเกินไป",
        1100: "ไม่สามารถเข้าสู่ระบบด้วย Google ได้",
        1101: "บัญชี Google นี้ไม่มีอีเมลแนบมา",
        1200: "กรุณายืนยันอีเมลก่อนใช้งานต่อ",
        1201: "ถ้ามีบัญชีอีเมลนี้ เราได้ส่งลิงก์รีเซ็ตรหัสผ่านให้แล้ว",
        1202: "ลิงก์รีเซ็ตรหัสผ่านไม่ถูกต้อง",
        1203: "ลิงก์รีเซ็ตรหัสผ่านหมดอายุ",
        1999: "เกิดข้อผิดพลาดที่ไม่คาดคิด",
      },

      or_signin: "หรือ",
    },
  },
};

i18n
  .use(LanguageDetector) // 👈 add this
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: "en",
    detection: {
      // persist in localStorage
      order: ["localStorage", "navigator"],
      caches: ["localStorage"],
    },
    interpolation: { escapeValue: false },
  });

export default i18n;
