const auth = {
  // Auth / Login
  login: "เข้าสู่ระบบ",
  signup: "สมัครสมาชิก",
  or_signin: "มีบัญชีอยู่แล้ว?",
  create_account: "สร้างบัญชี",
  sign_in_google: "เข้าสู่ระบบด้วย Google",
  reset_password: "รีเซ็ตรหัสผ่าน",
  activate: "เปิดใช้งาน",
  deactivate: "ปิดใช้งาน",
  verify_now: "ยืนยันตอนนี้",
  reset_password_here: "รีเซ็ตรหัสผ่านที่นี่",
  login_type_owner: "เจ้าของ",
  login_type_staff: "พนักงาน",

  login_error_unverified: "อีเมลของคุณยังไม่ได้รับการยืนยัน",
  login_error_bad_password: "รหัสผ่านไม่ถูกต้อง",
  login_error_no_account: "ไม่พบบัญชีนี้",

  login_staff_not_found: "อีเมลนี้ไม่พบในรายชื่อพนักงาน",
  login_staff_invite_pending: "บัญชีพนักงานยังไม่ได้เปิดใช้งาน",
  login_staff_inactive: "บัญชีพนักงานถูกปิดใช้งาน",
  switch_to_owner_login: "สลับไปเข้าสู่ระบบเจ้าของร้าน",
  login_staff_bad_password: "รหัสผ่านไม่ถูกต้อง",
  login_staff_contact_owner: "กรุณาติดต่อเจ้าของร้าน",

  // Signup
  password_requirements_title: "ข้อกำหนดรหัสผ่าน",
  password_rule_uppercase: "ตัวอักษรพิมพ์ใหญ่อย่างน้อย 1 ตัว",
  password_rule_number: "ตัวเลขอย่างน้อย 1 ตัว",
  password_rule_length: "ความยาวอย่างน้อย 8 ตัวอักษร",
  password_rule_symbol: "สัญลักษณ์อย่างน้อย 1 ตัว: ! @ # $ % ^ & * . _ -",
  password_confirm: "ยืนยันรหัสผ่าน",
  password_rule_match: "รหัสผ่านและยืนยันรหัสผ่านเหมือนกัน",
  password_requirements_incorrect: "รหัสผ่านไม่ถูกต้องตามความต้องการ",
  confirm_password_incorrect: "ยืนยันรหัสผ่านไม่ถูกต้องตามความต้องการ",
  signup_success:
    "สร้างบัญชีผู้ใช้สำเร็จแล้ว กรุณายืนยันอีเมลของคุณเพื่อให้การสมัครสมบูรณ์",

  // Email verification
  verify_email_title: "ยืนยันอีเมลของคุณ",
  verify_email_desc:
    "เราได้ส่งลิงก์ยืนยันไปยังอีเมลของคุณ หากยังไม่ได้รับ คุณสามารถส่งอีกครั้งได้ด้านล่าง",
  link_sent: "ถ้ามีบัญชีนี้อยู่ เราได้ส่งลิงก์ยืนยันใหม่ให้แล้ว",
  resend_link: "ส่งลิงก์ยืนยันอีกครั้ง",
  open_email_app: "เปิดแอปอีเมล",

  // Staff setup / reset
  staff_setup_title: "เปิดใช้งานบัญชีพนักงาน",
  staff_set_password: "ตั้งรหัสผ่านและเปิดใช้งาน",
  reset_link_sent: "ส่งลิงก์รีเซ็ตรหัสผ่านเรียบร้อยแล้ว",
  invite_used: "ลิงก์เชิญนี้ถูกใช้งานแล้ว",
  invite_invalid: "ลิงก์คำเชิญไม่ถูกต้อง",
  invite_expired: "ลิงก์คำเชิญหมดอายุแล้ว",
  staff_reset_password_success: "รีเซ็ตรหัสผ่านสำเร็จแล้ว",
  staff_reset_invalid: "ลิงก์สำหรับรีเซ็ตรหัสผ่านไม่ถูกต้อง",
  staff_reset_expired: "ลิงก์สำหรับรีเซ็ตรหัสผ่านหมดอายุแล้ว",

  reset_request_title: "ลืมรหัสผ่าน?",
  reset_request_intro:
    "กรุณากรอกอีเมลของคุณ เราจะส่งลิงก์สำหรับตั้งรหัสผ่านใหม่ไปให้",
  reset_request_submit: "ส่งลิงก์ตั้งรหัสผ่าน",
  reset_request_success:
    "หากอีเมลนี้มีอยู่ในระบบ เราได้ส่งลิงก์สำหรับตั้งรหัสผ่านใหม่ให้แล้ว",
  forgot_password_link: "ลืมรหัสผ่าน?",
  reset_password_title: "ตั้งรหัสผ่านใหม่",
  reset_password_cta: "บันทึกรหัสผ่านใหม่",
  reset_password_success:
    "รีเซ็ตรหัสผ่านสำเร็จแล้ว กรุณาดำเนินการต่อที่หน้าล็อคอิน",
};

export default auth;
