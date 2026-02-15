<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <title>Reset your password</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
  </head>

  <body style="margin:0; padding:0; background-color:#f1f5f9; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f1f5f9; padding:24px 0;">
      <tr>
        <td align="center" style="padding:0 12px;">

          <!-- Card -->
          <table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px; background:#ffffff; border-radius:14px; box-shadow:0 12px 30px rgba(15,23,42,0.08); overflow:hidden;">

            <!-- Header / Logo -->
            <tr>
              <td style="padding:24px; text-align:center;">
                <div>
                  <div style="margin-top:2px; font-size:24px; font-weight:700; color:#4f46e5;">
                    JustAMomentPlease
                  </div>
                  <div style="margin-top:2px; font-size:12px; font-weight:500; color:#94a3b8;">
                    Online Queue Pager App
                  </div>
                </div>
              </td>
            </tr>

            <!-- Divider -->
            <tr>
              <td style="height:1px; background:#e2e8f0;"></td>
            </tr>

            <!-- Content -->
            <tr>
              <td style="padding:24px; color:#334155; font-size:14px; line-height:1.6;">

                <!-- EN -->
                <p style="margin:0 0 12px;">
                  We received a request to reset your password.
                </p>

                <p style="margin:0 0 20px;">
                  Click the button below to set a new password:
                </p>

                <!-- CTA -->
                <div style="text-align:center; margin:24px 0;">
                  <a
                    href="{{ $resetUrl }}"
                    style="
                      display:inline-block;
                      padding:12px 22px;
                      background:#4f46e5;
                      color:#ffffff;
                      text-decoration:none;
                      border-radius:999px;
                      font-weight:700;
                      font-size:14px;
                      box-shadow:0 10px 24px rgba(79,70,229,0.35);
                    "
                  >
                    Reset Password
                  </a>
                </div>

                <p style="margin:0 0 10px; font-size:12px; color:#64748b;">
                  This link will expire in <strong>{{ $expiresMinutes ?? 60 }} minutes</strong>.
                </p>

                <!-- Separator -->
                <hr style="border:none; border-top:1px dashed #e2e8f0; margin:20px 0;">

                <!-- TH -->
                <p style="margin:0 0 12px;">
                  เราได้รับคำขอให้ตั้งรหัสผ่านใหม่สำหรับบัญชีของคุณ
                </p>

                <p style="margin:0 0 20px;">
                  กรุณาคลิกปุ่มด้านล่างเพื่อตั้งรหัสผ่านใหม่:
                </p>

                <div style="text-align:center; margin:24px 0;">
                  <a
                    href="{{ $resetUrl }}"
                    style="
                      display:inline-block;
                      padding:12px 22px;
                      background:#4f46e5;
                      color:#ffffff;
                      text-decoration:none;
                      border-radius:999px;
                      font-weight:700;
                      font-size:14px;
                      box-shadow:0 10px 24px rgba(79,70,229,0.35);
                    "
                  >
                    ตั้งรหัสผ่านใหม่
                  </a>
                </div>

                <p style="margin:0; font-size:12px; color:#64748b;">
                  ลิงก์นี้จะหมดอายุภายใน <strong>{{ $expiresMinutes ?? 60 }} นาที</strong>
                </p>

                <!-- Separator -->
                <hr style="border:none; border-top:1px dashed #e2e8f0; margin:20px 0;">

                <!-- Fallback link -->
                <p style="margin:0 0 8px; font-size:12px; color:#64748b;">
                  If the button doesn’t work, copy and paste this link into your browser:<br>
                  หากปุ่มไม่ทำงาน ให้คัดลอกลิงก์นี้ไปวางในเบราว์เซอร์:
                </p>

                <p style="word-break:break-all; font-size:12px; margin:0;">
                  <a
                    href="{{ $resetUrl }}"
                    style="color:#4f46e5; text-decoration:underline; text-underline-offset:2px;"
                  >
                    {{ $resetUrl }}
                  </a>
                </p>

                <p style="margin:16px 0 0; font-size:12px; color:#64748b;">
                  Need help? Contact us at<br>
                  ต้องการความช่วยเหลือ ติดต่อเราได้ที่:
                  <a href="mailto:{{ config('mail.reply_to.address') }}">{{ config('mail.reply_to.address') }}</a>
                </p>

              </td>
            </tr>

            <!-- Divider -->
            <tr>
              <td style="height:1px; background:#e2e8f0;"></td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style="padding:16px 24px; font-size:11px; color:#94a3b8; text-align:center;">
                If you didn’t request this password reset, you can safely ignore this email.<br>
                หากคุณไม่ได้เป็นผู้ร้องขอ กรุณาละเว้นอีเมลฉบับนี้ได้อย่างปลอดภัย
                <br><br>
                — {{ $appName ?? config('app.name') }} Team
              </td>
            </tr>

          </table>

        </td>
      </tr>
    </table>
  </body>
</html>
