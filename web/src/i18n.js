// web/src/i18n.js
import i18n from "i18next";
import { initReactI18next } from "react-i18next";

const savedLang = localStorage.getItem("lang") || "en";

i18n.use(initReactI18next).init({
  lng: savedLang,
  fallbackLng: "en",
  interpolation: { escapeValue: false },

  resources: {
    /* ------------------------------------------------------------------
     * ENGLISH
     * ------------------------------------------------------------------ */
    en: {
      translation: {
        /* ---------- General ---------- */
        loading: "Loading...",
        logout: "Logout",
        email: "Email",
        password: "Password",
        name: "Name",
        actions: "Actions",
        status: "Status",
        active: "Active",
        inactive: "Inactive",
        invalid_email: "Invalid email format",
        confirm: "Confirm",
        cancel: "Cancel",
        back: "Back",
        your_name: "Your name",
        confirm_password: "Confirm password",
        back_to_login: "Back to Login",
        email_address: "Email address",
        close: "Close",
        remove: "Remove",

        /* ---------- Auth / Login ---------- */
        login: "Login",
        signup: "Sign up",
        or_signin: "Already have an account?",
        create_account: "Create account",
        sign_in_google: "Sign in with Google",
        reset_password: "Reset Password",
        verify_now: "Verify now",
        reset_password_here: "Reset password here",
        login_type_owner: "Owner",
        login_type_staff: "Staff",

        /* Owner login error cases */
        login_error_unverified: "Your email has not been verified.",
        login_error_bad_password: "Incorrect password.",
        login_error_no_account: "This email is not registered.",

        /* Staff login error cases */
        login_staff_not_found: "This email is not linked to any staff account.",
        login_staff_invite_pending:
          "Your staff account has not been activated yet.",
        login_staff_inactive: "This staff account is inactive.",
        login_staff_bad_password: "Incorrect password.",
        switch_to_owner_login: "Switch to Owner login",
        login_staff_contact_owner:
          "Please contact your shop owner to continue.",

        /* ---------- Signup ---------- */
        logo_requirements_title: "Logo requirements",
        logo_req_size: "File size ≤ 2 MB",
        logo_req_resolution: "Resolution ≤ 1024×1024 px",
        logo_req_types: "PNG / JPG / JPEG",
        password_requirements_title: "Password requirements",
        password_rule_uppercase: "At least one uppercase letter",
        password_rule_number: "At least one number",
        password_rule_length: "At least 8 characters",
        password_rule_symbol: "At least one symbol: ! @ # $ % ^ & * . _ -",
        password_rule_match: "Password and confirmation password matched",
        password_confirm: "Confirm Password",
        password_requirements_error: "Password is not match with requirements",
        confirm_password_incorrect:
          "Confirm password is not match with requirements",

        /* ---------- Email verification ---------- */
        verify_email_title: "Verify your email",
        verify_email_desc:
          "We’ve sent a verification link to your email. If you didn’t get it, you can resend it below.",
        link_sent:
          "If an account exists for this email, we have sent a new verification link.",
        resend_link: "Resend verification link",
        open_email_app: "Open email app",

        /* ---------- Error Codes ---------- */
        errors: {
          1000: "Some fields are invalid.",
          1001: "This field is required.",
          1002: "Please enter a valid email address.",
          1003: "Invalid format.",
          1004: "Too short. Minimum {{min}} characters.",
          1005: "Too long. Maximum {{max}} characters.",
          1006: "This email is already registered.",
          1007: "Invalid image file.",
          1008: "File is too large.",
          1009: "Image resolution is too large.",
          1010: "Invalid file or unsupported format.",
          1011: "Image resolution exceeds {{max_width}} × {{max_height}} pixels.",
          1012: "This email is already taken.",
          1013: "This username is already taken.",
          1014: "This phone number is already taken.",
          1015: "Password is too weak.",
          1020: "Confirm password is not same as password.",
          2000: "Invalid email or password.",
          2001: "You are not authorized.",
          2002: "You do not have permission to perform this action.",
          2003: "Your session has expired. Please log in again.",
          2004: "Invalid token.",
          2005: "Your session has expired.",
          2006: "Authentication token missing.",
          2007: "Account not found.",
          2008: "This account is inactive.",
          3000: "Your email is not verified.",
          3001: "Your email has already been verified.",
          3002: "Verification link is invalid.",
          3003: "Verification link has expired.",
          3004: "Password reset email sent.",
          3005: "Invalid reset token.",
          3006: "Reset link has expired.",
          5003: "Shop logo resolution exceeds the allowed limits.",
          9000: "Unexpected error occurred.",
          9001: "Network error. Please try again.",
        },

        /* ---------- Staff Setup / Reset ---------- */
        staff_setup_title: "Activate Staff Account",
        staff_setup_intro:
          "Create your password to activate your staff account.",
        staff_reset_title: "Reset Staff Password",
        staff_reset_intro:
          "Enter your new password to complete the reset process.",
        reset_link_sent: "Password reset link sent successfully.",

        /* ------------------------------------------------------------------
         * ORDERS PAGE
         * ------------------------------------------------------------------ */
        orders_title: "Orders",
        order_created: "Order created.",
        order_updated: "Order updated.",
        order_number_conflict: "Order number already exists for today.",
        order_invalid_transition:
          "Cannot change to this status from current state.",
        order_not_found: "Order not found.",
        refresh: "Refresh",
        order_create_title: "Create order",
        order_create_subtitle:
          "Leave Order No. empty to let the system generate it. Fill it if you want to match a POS ticket number.",
        order_no_label: "Order No. (optional)",
        order_no_placeholder: "e.g. A-101",
        pos_ref_label: "POS Ref (optional)",
        pos_ref_placeholder: "e.g. POS-2025-0001",
        order_create_button: "Create",
        order_creating: "Creating...",
        order_status_pending: "Pending",
        order_status_ready: "Ready",
        order_status_done: "Done",
        orders_empty: "No orders",
        order_label: "Order",
        order_item_unnamed: "Item",
        order_items_more: "More items...",
        mark_ready: "Mark ready",
        mark_done: "Mark done",
        order_items_title: "Order items",
        add_item: "Add item",
        order_item_name_placeholder: "e.g. Pad Thai, Americano",
        qty_label: "Qty",
        order_item_note_placeholder: "Note (optional)",
        view_qr: "View QR",
        open_customer_page: "Open page",

        /* ------------------------------------------------------------------
         * SHOP SETTINGS
         * ------------------------------------------------------------------ */
        shop_settings_title: "Shop Settings",
        shop_name: "Shop Name",
        shop_logo: "Shop Logo",
        shop_update: "Update Shop",
        shop_update_success: "Shop information updated successfully.",
        shop_name_label: "Shop Name",
        order_numbering_mode: "Order numbering mode",
        numbering_sequential: "Sequential (resets daily)",
        numbering_random: "Random",
        customer_sound: "Customer notification sound",
        save_changes: "Save Changes",
        delete_shop: "Delete Shop",
        delete_shop_confirm:
          "Are you sure you want to delete this shop? This action cannot be undone.",

        /* Staff management section */
        invite_staff: "Invite Staff",
        staff_list: "Staff List",
        staff_name_label: "Staff Name",
        staff_email: "Staff Email",
        send_invite: "Send Invite",
        resend_invite: "Resend Invite",
        invite_sent: "Invitation email sent successfully.",
        invite_resent: "Invitation email resent successfully.",
        staff_deactivated: "Staff deactivated successfully.",
        confirm_deactivate: "Are you sure you want to deactivate this staff?",
        no_staff: "No staff members found.",

        /* ------------------------------------------------------------------
         * ACCOUNT SETTINGS
         * ------------------------------------------------------------------ */
        account_settings_title: "Account Settings",
        account_role: "Role",
        role_owner: "Owner",
        role_staff: "Staff",
        account_settings_intro:
          "Manage your personal account settings here. Additional options such as password change will be added soon.",
        change_password: "Change Password",
        password_change_coming: "Change password (coming soon)",
      },
    },

    /* ------------------------------------------------------------------
     * THAI
     * ------------------------------------------------------------------ */
    th: {
      translation: {
        /* ---------- General ---------- */
        loading: "กำลังโหลด...",
        logout: "ออกจากระบบ",
        email: "อีเมล",
        password: "รหัสผ่าน",
        name: "ชื่อ",
        actions: "การทำงาน",
        status: "สถานะ",
        active: "เปิดใช้งาน",
        inactive: "ปิดใช้งาน",
        invalid_email: "รูปแบบอีเมลไม่ถูกต้อง",
        confirm: "ยืนยัน",
        cancel: "ยกเลิก",
        back: "กลับ",
        your_name: "ชื่อของคุณ",
        confirm_password: "ยืนยันรหัสผ่าน",
        back_to_login: "กลับสู่หน้าเข้าสู่ระบบ",
        email_address: "ที่อยู่อีเมล",
        close: "ปิด",
        remove: "ลบ",

        /* ---------- Auth / Login ---------- */
        login: "เข้าสู่ระบบ",
        signup: "สมัครสมาชิก",
        create_account: "สร้างบัญชี",
        sign_in_google: "เข้าสู่ระบบด้วย Google",
        reset_password: "รีเซ็ตรหัสผ่าน",
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

        /* ---------- Signup ---------- */
        logo_requirements_title: "ข้อกำหนดโลโก้",
        password_requirements_title: "ข้อกำหนดรหัสผ่าน",
        password_rule_uppercase: "ตัวอักษรพิมพ์ใหญ่อย่างน้อย 1 ตัว",
        password_rule_number: "ตัวเลขอย่างน้อย 1 ตัว",
        password_rule_length: "ความยาวอย่างน้อย 8 ตัวอักษร",
        password_rule_symbol: "สัญลักษณ์อย่างน้อย 1 ตัว: ! @ # $ % ^ & * . _ -",
        password_confirm: "ยืนยันรหัสผ่าน",
        password_rule_match: "รหัสผ่านและยืนยันรหัสผ่านเหมือนกัน",
        password_requirements_incorrect: "รหัสผ่านไม่ถูกต้องตามความต้องการ",
        confirm_password_incorrect: "ยืนยันรหัสผ่านไม่ถูกต้องตามความต้องการ",

        /* ---------- Email verification ---------- */
        verify_email_title: "ยืนยันอีเมลของคุณ",
        verify_email_desc:
          "เราได้ส่งลิงก์ยืนยันไปยังอีเมลของคุณ หากยังไม่ได้รับ คุณสามารถส่งอีกครั้งได้ด้านล่าง",
        link_sent: "ถ้ามีบัญชีนี้อยู่ เราได้ส่งลิงก์ยืนยันใหม่ให้แล้ว",
        resend_link: "ส่งลิงก์ยืนยันอีกครั้ง",
        open_email_app: "เปิดแอปอีเมล",

        /* ---------- Error Codes ---------- */
        errors: {
          1000: "ข้อมูลบางส่วนไม่ถูกต้อง",
          1001: "จำเป็นต้องกรอกข้อมูลในช่องนี้",
          1002: "อีเมลไม่ถูกต้อง",
          1003: "รูปแบบข้อมูลไม่ถูกต้อง",
          1004: "ข้อมูลสั้นเกินไป ต้องมีอย่างน้อย {{min}} อักขระ",
          1005: "ข้อมูลยาวเกินไป ต้องไม่เกิน {{max}} อักขระ",
          1006: "อีเมลนี้มีผู้ใช้งานแล้ว",
          1007: "ไฟล์รูปภาพไม่ถูกต้อง",
          1008: "ไฟล์มีขนาดใหญ่เกินไป",
          1009: "ความละเอียดของรูปภาพสูงเกินไป",
          1010: "ไฟล์ไม่ถูกต้องหรือไม่รองรับ",
          1011: "ความละเอียดรูปภาพเกินกว่า {{max_width}} × {{max_height}} พิกเซล",
          1012: "อีเมลนี้ถูกใช้งานไปแล้ว",
          1013: "ชื่อผู้ใช้นี้ถูกใช้งานไปแล้ว",
          1014: "เบอร์โทรศัพท์นี้ถูกใช้งานไปแล้ว",
          1015: "รหัสผ่านไม่แข็งแรงพอ",
          1020: "ยืนยันรหัสผ่านไม่ตรงกับรหัสผ่าน",
          2000: "อีเมลหรือรหัสผ่านไม่ถูกต้อง",
          2001: "ไม่มีสิทธิ์เข้าถึง",
          2002: "คุณไม่มีสิทธิ์ดำเนินการนี้",
          2003: "เซสชันหมดอายุ กรุณาเข้าสู่ระบบอีกครั้ง",
          2004: "โทเคนไม่ถูกต้อง",
          2005: "เซสชันหมดอายุ",
          2006: "ไม่พบโทเคนเข้าสู่ระบบ",
          2007: "ไม่พบบัญชีผู้ใช้นี้",
          2008: "บัญชีนี้ถูกระงับการใช้งาน",
          3000: "อีเมลของคุณยังไม่ได้รับการยืนยัน",
          3001: "อีเมลนี้ได้รับการยืนยันแล้ว",
          3002: "ลิงก์ยืนยันไม่ถูกต้อง",
          3003: "ลิงก์ยืนยันหมดอายุ",
          3004: "ส่งอีเมลรีเซ็ตรหัสผ่านแล้ว",
          3005: "โทเคนรีเซ็ตไม่ถูกต้อง",
          3006: "ลิงก์รีเซ็ตหมดอายุ",
          5003: "โลโก้ร้านมีความละเอียดเกินกว่าที่กำหนด",
          9000: "เกิดข้อผิดพลาดที่ไม่คาดคิด",
          9001: "เกิดปัญหาการเชื่อมต่อ กรุณาลองใหม่",
        },

        /* ---------- Staff Setup / Reset ---------- */
        staff_setup_title: "เปิดใช้งานบัญชีพนักงาน",
        staff_setup_intro: "สร้างรหัสผ่านเพื่อเปิดใช้งานบัญชีพนักงานของคุณ",
        staff_reset_title: "รีเซ็ตรหัสผ่านพนักงาน",
        staff_reset_intro: "กรอกรหัสผ่านใหม่เพื่อรีเซ็ตบัญชี",
        reset_link_sent: "ส่งลิงก์รีเซ็ตรหัสผ่านเรียบร้อยแล้ว",

        /* ------------------------------------------------------------------
         * ORDERS PAGE
         * ------------------------------------------------------------------ */
        orders_title: "ออเดอร์",
        order_created: "สร้างออเดอร์เรียบร้อยแล้ว",
        order_updated: "อัปเดตออเดอร์เรียบร้อยแล้ว",
        order_number_conflict: "มีหมายเลขออเดอร์นี้ในวันนี้แล้ว",
        order_invalid_transition: "ไม่สามารถเปลี่ยนสถานะจากสถานะปัจจุบันได้",
        order_not_found: "ไม่พบออเดอร์นี้",
        refresh: "รีเฟรช",
        order_create_title: "สร้างออเดอร์ใหม่",
        order_create_subtitle:
          "ปล่อยช่องหมายเลขออเดอร์ว่างไว้ หากต้องการให้ระบบสร้างให้โดยอัตโนมัติ หรือกรอกหมายเลขหากต้องการใช้หมายเลขเดียวกับ POS",
        order_no_label: "หมายเลขออเดอร์ (ไม่บังคับ)",
        order_no_placeholder: "เช่น A-101",
        pos_ref_label: "หมายเลขอ้างอิงจาก POS (ไม่บังคับ)",
        pos_ref_placeholder: "เช่น POS-2025-0001",
        order_create_button: "สร้างออเดอร์",
        order_creating: "กำลังสร้าง...",
        order_status_pending: "กำลังทำ",
        order_status_ready: "พร้อมเสิร์ฟ",
        order_status_done: "เสร็จสิ้น",
        orders_empty: "ยังไม่มีออเดอร์",
        order_label: "ออเดอร์",
        order_item_unnamed: "สินค้า",
        order_items_more: "ดูเพิ่มเติม...",
        mark_ready: "แจ้งพร้อมเสิร์ฟ",
        mark_done: "เสร็จสิ้น",
        order_items_title: "รายการสินค้าในออเดอร์",
        add_item: "เพิ่มรายการ",
        order_item_name_placeholder: "เช่น ผัดไทย, อเมริกาโน่",
        qty_label: "จำนวน",
        order_item_note_placeholder: "หมายเหตุ (ไม่บังคับ)",
        view_qr: "ดู QR ขนาดใหญ่",
        open_customer_page: "เปิดหน้าลูกค้า",

        /* ------------------------------------------------------------------
         * SHOP SETTINGS
         * ------------------------------------------------------------------ */
        shop_settings_title: "ตั้งค่าร้านค้า",
        shop_name: "ชื่อร้าน",
        shop_logo: "โลโก้ร้าน",
        shop_update: "อัปเดตร้าน",
        shop_update_success: "อัปเดตข้อมูลร้านเรียบร้อยแล้ว",
        shop_name_label: "ชื่อร้าน",
        order_numbering_mode: "รูปแบบหมายเลขออเดอร์",
        numbering_sequential: "ลำดับต่อเนื่อง (รีเซ็ตทุกวัน)",
        numbering_random: "สุ่ม",
        customer_sound: "เสียงแจ้งเตือนลูกค้า",
        save_changes: "บันทึกการเปลี่ยนแปลง",
        delete_shop: "ลบร้าน",
        delete_shop_confirm:
          "คุณแน่ใจหรือไม่ว่าต้องการลบร้าน? การกระทำนี้ไม่สามารถย้อนกลับได้",

        /* Staff management */
        invite_staff: "เชิญพนักงาน",
        staff_list: "รายชื่อพนักงาน",
        staff_name_label: "ชื่อพนักงาน",
        staff_email: "อีเมลพนักงาน",
        send_invite: "ส่งคำเชิญ",
        resend_invite: "ส่งคำเชิญอีกครั้ง",
        invite_sent: "ส่งคำเชิญเรียบร้อยแล้ว",
        invite_resent: "ส่งคำเชิญอีกครั้งเรียบร้อยแล้ว",
        staff_deactivated: "ปิดการใช้งานพนักงานเรียบร้อยแล้ว",
        confirm_deactivate: "คุณแน่ใจหรือไม่ว่าต้องการปิดการใช้งานพนักงานนี้?",
        no_staff: "ยังไม่มีพนักงาน",

        /* ------------------------------------------------------------------
         * ACCOUNT SETTINGS
         * ------------------------------------------------------------------ */
        account_settings_title: "ตั้งค่าบัญชี",
        account_role: "บทบาท",
        role_owner: "เจ้าของร้าน",
        role_staff: "พนักงาน",
        account_settings_intro:
          "ตั้งค่าบัญชีส่วนตัวของคุณได้ที่นี่ ฟีเจอร์เพิ่มเติม เช่น เปลี่ยนรหัสผ่าน จะถูกเพิ่มในภายหลัง",
        change_password: "เปลี่ยนรหัสผ่าน",
        password_change_coming: "เปลี่ยนรหัสผ่าน (เร็วๆ นี้)",
      },
    },
  },
});

export default i18n;
