<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Verify your email</title>
</head>

<body style="margin:0; padding:0; background-color:#f1f5f9; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f1f5f9; padding:24px 0;">
    <tr>
      <td align="center">

        <!-- Card -->
        <table width="100%" cellpadding="0" cellspacing="0"
          style="max-width:480px; background:#ffffff; border-radius:14px; box-shadow:0 12px 30px rgba(15,23,42,0.08); overflow:hidden;">

          <!-- Header -->
          <tr>
            <td style="padding:24px; text-align:center;">
              <div style="margin-top:2px; font-size:24px; font-weight:700; color:#4f46e5;">
                VIPA
              </div>
              <div style="margin-top:6px; font-size:14px; font-weight:500; color:#94a3b8;">
                Virtual Pager
              </div>
            </td>
          </tr>

          <tr>
            <td style="height:1px; background:#e2e8f0;"></td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding:24px; color:#334155; font-size:14px; line-height:1.6;">

              <!-- EN -->
              <p style="margin:0 0 12px;">
                Thanks for signing up! Please verify your email address to continue.
              </p>

              <p style="margin:0 0 20px;">
                Click the button below to confirm your email:
              </p>

              <div style="text-align:center; margin:24px 0;">
                <a
                  href="{{ $verifyUrl }}"
                  style="
                    display:inline-block;
                    padding:12px 22px;
                    background:#4f46e5;
                    color:#ffffff;
                    text-decoration:none;
                    border-radius:999px;
                    font-weight:600;
                    font-size:14px;
                    box-shadow:0 10px 24px rgba(79,70,229,0.35);
                  "
                >
                  Verify Email
                </a>
              </div>

              <p style="margin:0 0 10px; font-size:12px; color:#64748b;">
                  This link will expire in <strong>{{ $expiresMinutes ?? 60 }} minutes</strong>.
                </p>

              <hr style="border:none; border-top:1px dashed #e2e8f0; margin:20px 0;">

              <!-- TH -->
              <p style="margin:0 0 12px;">
                ขอบคุณที่สมัครใช้งาน กรุณายืนยันอีเมลของคุณเพื่อดำเนินการต่อ
              </p>

              <p style="margin:0 0 20px;">
                คลิกปุ่มด้านล่างเพื่อยืนยันอีเมล:
              </p>

              <div style="text-align:center; margin:24px 0;">
                <a
                  href="{{ $verifyUrl }}"
                  style="
                    display:inline-block;
                    padding:12px 22px;
                    background:#4f46e5;
                    color:#ffffff;
                    text-decoration:none;
                    border-radius:999px;
                    font-weight:600;
                    font-size:14px;
                    box-shadow:0 10px 24px rgba(79,70,229,0.35);
                  "
                >
                  ยืนยันอีเมล
                </a>
              </div>

              <p style="margin:0; font-size:12px; color:#64748b;">
                  ลิงก์นี้จะหมดอายุภายใน <strong>{{ $expiresMinutes ?? 60 }} นาที</strong>
                </p>

              <!-- Fallback -->
              <p style="margin:20px 0 8px; font-size:12px; color:#64748b;">
                If the button doesn’t work, copy and paste this link into your browser<br>
                หากปุ่มไม่ทำงาน ให้คัดลอกลิงก์นี้ไปวางในเบราว์เซอร์:
              </p>

              <p style="word-break:break-all; font-size:12px; margin:0;">
                <a href="{{ $verifyUrl }}" style="color:#4f46e5;">
                  {{ $verifyUrl }}
                </a>
              </p>

              <p style="margin:16px 0 0; font-size:12px; color:#64748b;">
                Need help? Contact us at<br>
                ต้องการความช่วยเหลือ ติดต่อเราได้ที่:
                <a href="mailto:{{ config('mail.reply_to.address') }}">{{ config('mail.reply_to.address') }}</a>
              </p>

            </td>
          </tr>

          <tr>
            <td style="height:1px; background:#e2e8f0;"></td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:16px 24px; font-size:11px; color:#94a3b8; text-align:center;">
              If you didn’t create an account, you can safely ignore this email.<br>
              หากคุณไม่ได้สมัครใช้งาน กรุณาละเว้นอีเมลฉบับนี้ได้อย่างปลอดภัย
              <br><br>
              — {{ $appName }} Team
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>
</body>
</html>
