<!doctype html>
<html>
  <body>
    <p>You’ve been invited to join <strong>{{ $shopName }}</strong> as staff.</p>
    <p>Click this link to set your password and activate your account:</p>
    <p><a href="{{ $acceptUrl }}">{{ $acceptUrl }}</a></p>
    <p>This link expires in 72 hours.</p>
  </body>
</html>
