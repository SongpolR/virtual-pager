<!doctype html>
<html>
  <body>
    <p>You requested a password reset for your staff account at <strong>{{ $shopName }}</strong>.</p>
    <p>Click this link to set a new password:</p>
    <p><a href="{{ $resetUrl }}">{{ $resetUrl }}</a></p>
    <p>This link expires in 60 minutes.</p>
  </body>
</html>
