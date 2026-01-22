<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\Facades\Mail;
use Illuminate\Validation\ValidationException;
use App\Mail\VerifyEmailMail;
use App\Mail\ResetPasswordMail;
use App\Models\Shop;

class AuthController extends Controller
{

  public function signup(Request $req)
  {
    try {
      $req->validate([
        'name'      => 'required|string|max:120',
        'email'     => 'required|email|max:190|unique:owners,email',
        'password'  => [
          'required',
          'string',
          'min:8',
          'regex:/[A-Z]/',
          'regex:/[0-9]/',
          'regex:/^[A-Za-z0-9!@#$%^&*._-]+$/',
        ],
        'confirm_password' => 'required|string|same:password',
        'shop_name' => 'required|string|max:120',
        'logo'      => 'nullable|image|max:2048',
      ]);

      // resolution limit ≤ 1024×1024
      if ($req->hasFile('logo')) {
        [$w, $h] = getimagesize($req->file('logo')->getPathname());
        if ($w > 1024 || $h > 1024) {
          return response()->json([
            'success' => false,
            'message' => 'VALIDATION_FAILED',
            'errors'  => [
              'logo' => [[
                'code' => config('errorcodes.LOGO_TOO_LARGE'),
                'meta' => [
                  'max_width'  => 1024,
                  'max_height' => 1024,
                ],
              ]],
            ],
          ], 422);
        }
      }

      return DB::transaction(function () use ($req) {
        $ownerId = DB::table('owners')->insertGetId([
          'name'       => $req->name,
          'email'      => $req->email,
          'password'   => Hash::make($req->password),
          'created_at' => now(),
          'updated_at' => now(),
        ]);

        $logoUrl = null;
        if ($req->hasFile('logo')) {
          $path    = $req->file('logo')->store('logos', 'public');
          $logoUrl = Storage::url($path);
        }

        Shop::create([
          'owner_id'   => $ownerId,
          'name' => $req->shop_name,
          'logo_url' => $logoUrl,
        ]);

        // Build signed verification URL (valid 60 minutes)
        $verifyUrl = URL::temporarySignedRoute(
          'auth.verify-email',
          now()->addMinutes(60),
          ['email' => $req->email]
        );

        $options = [
          'appName'     => config('app.name'),
          'expiresMinutes' => 60,
          'supportEmail' => config('app.support_email'),
        ];
        Mail::to($req->email)->send(new VerifyEmailMail($verifyUrl, $options));

        return response()->json([
          'success' => true,
          'message' => 'SIGNUP_SUCCESS_NEED_VERIFY',
          'data'    => [
            'email' => $req->email,
          ],
        ], 201);
      });
    } catch (ValidationException $e) {
      $errors = [];
      $failed = $e->validator->failed(); // field => [rule => params]

      foreach ($failed as $field => $rules) {
        foreach ($rules as $rule => $params) {
          $ruleUpper = strtoupper($rule);

          $code = match ($ruleUpper) {
            'REQUIRED' => config('errorcodes.REQUIRED_FIELD'),
            'EMAIL'    => config('errorcodes.INVALID_EMAIL'),
            'UNIQUE'   => config('errorcodes.EMAIL_TAKEN'),
            'MAX'      => config('errorcodes.TOO_LONG'),
            'MIN'      => config('errorcodes.TOO_SHORT'),
            'IMAGE'    => config('errorcodes.INVALID_IMAGE'),
            'REGEX'    => config('errorcodes.INVALID_FORMAT'),
            'SAME'     => config('errorcodes.PASSWORD_NOT_SAME'),
            default    => config('errorcodes.VALIDATION_ERROR'),
          };

          $meta = [];
          // For rules like min:8 / max:120 we can expose the limit
          if ($ruleUpper === 'MIN' && isset($params[0])) {
            $meta['min'] = $params[0];
          }
          if ($ruleUpper === 'MAX' && isset($params[0])) {
            $meta['max'] = $params[0];
          }

          $errors[$field][] = [
            'code' => $code,
            'meta' => $meta,
          ];
        }
      }

      return response()->json([
        'success' => false,
        'message' => 'VALIDATION_FAILED',
        'errors'  => $errors,
      ], 422);
    } catch (\Illuminate\Database\QueryException $e) {
      // Fallback in case a duplicate slips past validation (race condition)
      if (str_contains($e->getMessage(), 'Duplicate')) {
        return response()->json([
          'success' => false,
          'message' => 'VALIDATION_FAILED',
          'errors'  => [
            'email' => [[
              'code' => config('errorcodes.EMAIL_TAKEN'),
              'meta' => [],
            ]],
          ],
        ], 422);
      }

      throw $e;
    }
  }

  public function login(Request $req)
  {
    try {
      $req->validate([
        'email'    => 'required|email',
        'password' => 'required|string',
      ]);

      $owner = DB::table('owners')->where('email', $req->email)->first();

      if (!$owner) {
        return response()->json([
          'success' => false,
          'message' => 'ACCOUNT_NOT_FOUND',
        ], 404);
      }

      if (!Hash::check($req->password, $owner->password ?? '')) {
        return response()->json([
          'success' => false,
          'message' => 'INVALID_CREDENTIAL',
        ], 401);
      }

      if (!$owner->email_verified_at) {
        return response()->json([
          'success' => false,
          'message' => 'EMAIL_NOT_VERIFIED',
        ], 403);
      }

      $token = Str::random(64);

      DB::table('owner_api_tokens')->insert([
        'owner_id'   => $owner->id,
        'token'      => $token,
        'created_at' => now(),
        'updated_at' => now(),
      ]);

      return response()->json([
        'success' => true,
        'message' => 'LOGIN_SUCCESS',
        'data'    => [
          'token' => $token,
          // you can add user/role here later if needed
        ],
      ], 200);
    } catch (ValidationException $e) {
      // Map Laravel rules → numeric codes in config/errorcodes.php
      $map = [
        'REQUIRED' => config('errorcodes.REQUIRED_FIELD'),
        'EMAIL'    => config('errorcodes.INVALID_EMAIL'),
        'STRING'   => config('errorcodes.INVALID_FORMAT'),
        'MIN'      => config('errorcodes.TOO_SHORT') ?? config('errorcodes.VALIDATION_ERROR'),
        'MAX'      => config('errorcodes.TOO_LONG')  ?? config('errorcodes.VALIDATION_ERROR'),
      ];

      $errors = [];
      $failed = $e->validator->failed(); // field => [rule => params]

      foreach ($failed as $field => $rules) {
        foreach ($rules as $rule => $params) {
          $key  = strtoupper($rule);
          $code = $map[$key] ?? config('errorcodes.VALIDATION_ERROR');

          $meta = [];
          if ($key === 'MIN' && isset($params[0])) {
            $meta['min'] = $params[0];
          }
          if ($key === 'MAX' && isset($params[0])) {
            $meta['max'] = $params[0];
          }

          $errors[$field][] = [
            'code' => $code,
            'meta' => $meta,
          ];
        }
      }

      return response()->json([
        'success' => false,
        'message' => 'VALIDATION_FAILED',
        'errors'  => $errors,
      ], 422);
    }
  }
  public function logout(Request $req)
  {
    $token = $req->bearerToken();
    if ($token) DB::table('owner_api_tokens')->where('token', $token)->delete();
    return response()->json(['success' => true, 'message' => 'OK']);
  }

  public function verifyEmail(Request $req)
  {
    if (!$req->hasValidSignature()) {
      return response()->json(['message' => 'Invalid or expired link', 'errors' => [config('errorcodes.RESET_TOKEN_EXPIRED')]], 422);
    }
    $email = $req->query('email');
    $owner = DB::table('owners')->where('email', $email)->first();
    if (!$owner) {
      return response()->json(['message' => 'ACCOUNT_NOT_FOUND', 'error_code' => config('errorcodes.ACCOUNT_NOT_FOUND')], 404);
    }
    DB::table('owners')->where('id', $owner->id)->update(['email_verified_at' => now()]);
    return view('email-verified'); // tiny success page, or JSON if you prefer
  }

  public function resendVerification(Request $req)
  {
    try {
      $req->validate([
        'email' => 'required|email',
      ]);

      $owner = DB::table('owners')->where('email', $req->email)->first();

      if (!$owner) {
        // Do not reveal existence—return generic success
        return response()->json([
          'success' => true,
          'message' => 'VERIFY_EMAIL_SENT', // generic, used also when actually sent
        ], 200);
      }

      if ($owner->email_verified_at) {
        // Already verified – still a success, front-end may show a different text if desired
        return response()->json([
          'success' => true,
          'message' => 'EMAIL_ALREADY_VERIFIED',
        ], 200);
      }

      $verifyUrl = URL::temporarySignedRoute(
        'auth.verify-email',
        now()->addMinutes(60),
        ['email' => $owner->email]
      );

      $options = [
        'appName'     => config('app.name'),
        'expiresMinutes' => 60,
        'supportEmail' => config('app.support_email'),
      ];
      Mail::to($req->email)->send(new VerifyEmailMail($verifyUrl, $options));

      return response()->json([
        'success' => true,
        'message' => 'VERIFY_EMAIL_SENT',
      ], 200);
    } catch (ValidationException $e) {
      // Map Laravel validation rules → numeric codes in config/errorcodes.php
      $map = [
        'REQUIRED' => config('errorcodes.REQUIRED_FIELD'),
        'EMAIL'    => config('errorcodes.INVALID_EMAIL'),
        'STRING'   => config('errorcodes.INVALID_FORMAT'),
        'MIN'      => config('errorcodes.TOO_SHORT') ?? config('errorcodes.VALIDATION_ERROR'),
        'MAX'      => config('errorcodes.TOO_LONG')  ?? config('errorcodes.VALIDATION_ERROR'),
      ];

      $errors = [];
      $failed = $e->validator->failed(); // field => [rule => params]

      foreach ($failed as $field => $rules) {
        foreach ($rules as $rule => $params) {
          $key  = strtoupper($rule);
          $code = $map[$key] ?? config('errorcodes.VALIDATION_ERROR');

          $meta = [];
          if ($key === 'MIN' && isset($params[0])) {
            $meta['min'] = $params[0];
          }
          if ($key === 'MAX' && isset($params[0])) {
            $meta['max'] = $params[0];
          }

          $errors[$field][] = [
            'code' => $code,
            'meta' => $meta,
          ];
        }
      }

      return response()->json([
        'success' => false,
        'message' => 'VALIDATION_FAILED',
        'errors'  => $errors,
      ], 422);
    }
  }

  public function forgotPassword(Request $req)
  {
    try {
      $req->validate(['email' => 'required|email']);
      $owner = DB::table('owners')->where('email', $req->email)->first();
      if (!$owner) {
        return response()->json(['message' => 'ACCOUNT_NOT_FOUND', 'error_code' => config('errorcodes.ACCOUNT_NOT_FOUND')], 404);
      }
      $plain = Str::random(64);
      $hashed = Hash::make($plain);
      DB::table('password_reset_tokens')->updateOrInsert(
        ['email' => $owner->email],
        ['token' => $hashed, 'created_at' => now()]
      );
      // Link to your SPA reset page with token+email as query
      $frontend = config('app.frontend_origin', 'http://localhost:5173');
      $resetUrl = $frontend . '/reset-password?token=' . urlencode($plain) . '&email=' . urlencode($owner->email);
      $options = [
        'appName'     => config('app.name'),
        'expiresMinutes' => 60,
        'supportEmail' => config('app.support_email'),
      ];
      Mail::to($owner->email)->send(new ResetPasswordMail($resetUrl, $options));
      return response()->json([
        'success' => true,
        'message' => 'FORGOT_PASSWORD_EMAIL_SENT',
      ], 200);
    } catch (ValidationException $e) {
      // Map Laravel validation rules → numeric codes in config/errorcodes.php
      $map = [
        'REQUIRED' => config('errorcodes.REQUIRED_FIELD'),
        'EMAIL'    => config('errorcodes.INVALID_EMAIL'),
        'STRING'   => config('errorcodes.INVALID_FORMAT'),
        'MIN'      => config('errorcodes.TOO_SHORT') ?? config('errorcodes.VALIDATION_ERROR'),
        'MAX'      => config('errorcodes.TOO_LONG')  ?? config('errorcodes.VALIDATION_ERROR'),
      ];

      $errors = [];
      $failed = $e->validator->failed(); // field => [rule => params]

      foreach ($failed as $field => $rules) {
        foreach ($rules as $rule => $params) {
          $key  = strtoupper($rule);
          $code = $map[$key] ?? config('errorcodes.VALIDATION_ERROR');

          $meta = [];
          if ($key === 'MIN' && isset($params[0])) {
            $meta['min'] = $params[0];
          }
          if ($key === 'MAX' && isset($params[0])) {
            $meta['max'] = $params[0];
          }

          $errors[$field][] = [
            'code' => $code,
            'meta' => $meta,
          ];
        }
      }

      return response()->json([
        'success' => false,
        'message' => 'VALIDATION_FAILED',
        'errors'  => $errors,
      ], 422);
    }
  }

  public function resetPassword(Request $req)
  {
    try {
      $req->validate([
        'email' => 'required|email',
        'token' => 'required',
        'password' => ['required', 'string', 'min:8', 'regex:/[A-Z]/', 'regex:/[0-9]/', 'regex:/^[A-Za-z0-9!@#$%^&*._-]+$/'],
        'confirm_password' => 'required|string|same:password',
      ]);

      $row = DB::table('password_reset_tokens')->where('email', $req->email)->first();
      if (!$row) {
        return response()->json(['message' => 'RESET_TOKEN_INVALID', 'error_code' => config('errorcodes.RESET_TOKEN_INVALID')], 403);
      }
      // check age (60 minutes)
      if (!$row->created_at || now()->diffInMinutes($row->created_at) > 60) {
        return response()->json(['message' => 'RESET_TOKEN_EXPIRED', 'error_code' => config('errorcodes.RESET_TOKEN_EXPIRED')], 403);
      }
      // verify token
      if (!Hash::check($req->token, $row->token)) {
        return response()->json(['message' => 'RESET_TOKEN_INVALID', 'error_code' => config('errorcodes.RESET_TOKEN_INVALID')], 403);
      }
      // update password and cleanup
      DB::table('owners')->where('email', $req->email)->update(['password' => Hash::make($req->password)]);
      DB::table('password_reset_tokens')->where('email', $req->email)->delete();
      return response()->json([
        'success' => true,
        'message' => 'RESET_PASSWORD_SUCCESS',
      ], 200);
    } catch (ValidationException $e) {
      // Map Laravel validation rules → numeric codes in config/errorcodes.php
      $map = [
        'REQUIRED' => config('errorcodes.REQUIRED_FIELD'),
        'EMAIL'    => config('errorcodes.INVALID_EMAIL'),
        'STRING'   => config('errorcodes.INVALID_FORMAT'),
        'MIN'      => config('errorcodes.TOO_SHORT') ?? config('errorcodes.VALIDATION_ERROR'),
        'MAX'      => config('errorcodes.TOO_LONG')  ?? config('errorcodes.VALIDATION_ERROR'),
      ];

      $errors = [];
      $failed = $e->validator->failed(); // field => [rule => params]

      foreach ($failed as $field => $rules) {
        foreach ($rules as $rule => $params) {
          $key  = strtoupper($rule);
          $code = $map[$key] ?? config('errorcodes.VALIDATION_ERROR');

          $meta = [];
          if ($key === 'MIN' && isset($params[0])) {
            $meta['min'] = $params[0];
          }
          if ($key === 'MAX' && isset($params[0])) {
            $meta['max'] = $params[0];
          }

          $errors[$field][] = [
            'code' => $code,
            'meta' => $meta,
          ];
        }
      }

      return response()->json([
        'success' => false,
        'message' => 'VALIDATION_FAILED',
        'errors'  => $errors,
      ], 422);
    }
  }

  public function changePassword(Request $req)
  {
    try {
      $req->validate([
        'old_password' => 'required|string',
        'password' => [
          'required',
          'string',
          'min:8',
          'regex:/[A-Z]/',
          'regex:/[0-9]/',
          'regex:/^[A-Za-z0-9!@#$%^&*._-]+$/',
        ],
        'confirm_password' => 'required|string|same:password',
      ]);

      $ownerId = $req->attributes->get('owner_id');

      if (!$ownerId) {
        return response()->json([
          'success' => false,
          'message' => 'UNAUTHORIZED',
        ], 401);
      }

      $owner = DB::table('owners')->where('id', $ownerId)->first();

      if (!$owner) {
        return response()->json([
          'success' => false,
          'message' => 'UNAUTHORIZED'
        ], 401);
      }

      // ✅ Verify old password
      if (!Hash::check($req->old_password, $owner->password)) {
        return response()->json([
          'success' => false,
          'message' => 'VALIDATION_FAILED',
          'errors'  => [
            'old_password' => [
              [
                'code' => config('errorcodes.OLD_PASSWORD_INVALID'),
                'meta' => [],
              ],
            ],
          ],
        ], 422);
      }

      // ✅ Update password
      DB::table('owners')->where('id', $owner->id)->update([
        'password' => Hash::make($req->password),
        'updated_at' => now(),
      ]);

      // Invalidate all old tokens
      DB::table('owner_api_tokens')
        ->where('owner_id', $owner->id)
        ->delete();

      // Create and store new token (store only hash)
      $newToken = Str::random(64);

      DB::table('owner_api_tokens')->insert([
        'owner_id'     => $owner->id,
        'token'  => $newToken,
        'created_at'  => now(),
        'updated_at'  => now(),
      ]);

      return response()->json([
        'success' => true,
        'message' => 'CHANGE_PASSWORD_SUCCESS',
        'data' => ['token' => $newToken],
      ], 200);
    } catch (ValidationException $e) {
      // Map Laravel validation rules → numeric codes in config/errorcodes.php
      $map = [
        'REQUIRED' => config('errorcodes.REQUIRED_FIELD'),
        'EMAIL'    => config('errorcodes.INVALID_EMAIL'),
        'STRING'   => config('errorcodes.INVALID_FORMAT'),
        'MIN'      => config('errorcodes.TOO_SHORT') ?? config('errorcodes.VALIDATION_ERROR'),
        'MAX'      => config('errorcodes.TOO_LONG')  ?? config('errorcodes.VALIDATION_ERROR'),
        'SAME'     => config('errorcodes.NOT_MATCH') ?? config('errorcodes.VALIDATION_ERROR'),
        'REGEX'    => config('errorcodes.INVALID_FORMAT') ?? config('errorcodes.VALIDATION_ERROR'),
      ];

      $errors = [];
      $failed = $e->validator->failed(); // field => [rule => params]

      foreach ($failed as $field => $rules) {
        foreach ($rules as $rule => $params) {
          $key  = strtoupper($rule);
          $code = $map[$key] ?? config('errorcodes.VALIDATION_ERROR');

          $meta = [];
          if ($key === 'MIN' && isset($params[0])) {
            $meta['min'] = $params[0];
          }
          if ($key === 'MAX' && isset($params[0])) {
            $meta['max'] = $params[0];
          }

          $errors[$field][] = [
            'code' => $code,
            'meta' => $meta,
          ];
        }
      }

      return response()->json([
        'success' => false,
        'message' => 'VALIDATION_FAILED',
        'errors'  => $errors,
      ], 422);
    }
  }
}
