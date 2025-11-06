<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\Facades\Mail;
use App\Mail\VerifyEmailMail;
use App\Mail\PasswordResetMail;

class AuthController extends Controller
{
  public function signup(Request $req) {
    try {
      $req->validate([
        'name' => 'required|string|max:120',
        'email' => 'required|email|max:190|unique:owners,email',
        'password' => [
          'required','string','min:8',
          'regex:/[A-Z]/',                     // at least one uppercase
          'regex:/[0-9]/',                     // at least one number
          'regex:/^[A-Za-z0-9!@#$%^&*._-]+$/', // allowed chars only
        ],
        'shop_name' => 'required|string|max:120',
        'logo' => 'nullable|image|max:2048', // ≤2MB
      ]);

      // resolution limit ≤ 1024×1024
      if ($req->hasFile('logo')) {
        [$w,$h] = getimagesize($req->file('logo')->getPathname());
        if ($w > 1024 || $h > 1024) {
          return response()->json(['error'=>'logo_resolution_too_large'], 422);
        }
      }

      return DB::transaction(function () use ($req) {
        $ownerId = DB::table('owners')->insertGetId([
          'name'=>$req->name,
          'email'=>$req->email,
          'password'=>Hash::make($req->password),
          'created_at'=>now(),'updated_at'=>now(),
        ]);

        $logoUrl = null;
        if ($req->hasFile('logo')) {
          $path = $req->file('logo')->store('public/logos');
          $logoUrl = Storage::url($path); // needs storage:link
        }

        DB::table('shops')->insert([
          'owner_id'=>$ownerId,
          'name'=>$req->shop_name,
          'logo_url'=>$logoUrl,
          'order_mode'=>'SEQUENTIAL',
          'seq_next'=>1,
          'random_min'=>100,'random_max'=>999,
          'sound_key'=>'ding',
          'created_at'=>now(),'updated_at'=>now(),
        ]);

        // $token = Str::random(64);
        // DB::table('owner_api_tokens')->insert([
        //   'owner_id'=>$ownerId,'token'=>$token,
        //   'created_at'=>now(),'updated_at'=>now(),
        // ]);

        // // Build signed verification URL (valid 60 minutes)
        // $verifyUrl = URL::temporarySignedRoute(
        //   'auth.verify-email', now()->addMinutes(60), ['email' => $req->email]
        // );
        // Mail::to($req->email)->send(new VerifyEmailMail($verifyUrl));

        // return ['token'=>$token];

        // Build signed verification URL (valid 60 minutes)
        $verifyUrl = URL::temporarySignedRoute(
          'auth.verify-email', now()->addMinutes(60), ['email' => $req->email]
        );
        Mail::to($req->email)->send(new VerifyEmailMail($verifyUrl));
        
        return response()->json([
          'message' => 'Signup successful. Please verify your email to continue.',
          'errors' => []
        ], 200);
      });
    } catch (\Illuminate\Validation\ValidationException $e) {
      $codes = [];
        foreach ($e->errors() as $field => $messages) {
            foreach ($messages as $msg) {
                if (str_contains($msg, 'taken')) $codes[] = config('errorcodes.EMAIL_TAKEN');
                elseif (str_contains($msg, 'required')) $codes[] = config('errorcodes.REQUIRED_FIELD');
                elseif (str_contains($msg, 'valid')) $codes[] = config('errorcodes.INVALID_FORMAT');
                else $codes[] = config('errorcodes.UNKNOWN');
            }
        }

        return response()->json([
            'message' => 'Validation failed',
            'errors'  => array_values(array_unique($codes)),
        ], 422);
    } catch (\Illuminate\Database\QueryException $e) {
      if (str_contains($e->getMessage(), 'Duplicate')) {
            return response()->json([
                'message' => 'Email already registered',
                'errors'  => [config('errorcodes.EMAIL_TAKEN')],
            ], 422);
        }
        throw $e;
    }
  }

  public function login(Request $req) {
  $req->validate(['email'=>'required|email', 'password'=>'required']);

  $owner = DB::table('owners')->where('email', $req->email)->first();

  if (!$owner) {
    return response()->json([
      'message' => 'Account not found',
      'errors'  => [config('errorcodes.ACCOUNT_NOT_FOUND')],
    ], 404);
  }

  if (!Hash::check($req->password, $owner->password ?? '')) {
    return response()->json([
      'message' => 'Invalid credentials',
      'errors'  => [config('errorcodes.INVALID_CREDENTIAL')],
    ], 401);
  }

  if (!$owner->email_verified_at) {
    return response()->json([
      'message' => 'Email not verified',
      'errors'  => [config('errorcodes.EMAIL_NOT_VERIFIED')],
    ], 403);
  }

  $token = Str::random(64);
  DB::table('owner_api_tokens')->insert([
    'owner_id'=>$owner->id,'token'=>$token,
    'created_at'=>now(),'updated_at'=>now()
  ]);

  return ['token'=>$token];
}


  public function logout(Request $req) {
    $token = $req->bearerToken();
    if ($token) DB::table('owner_api_tokens')->where('token',$token)->delete();
    return ['ok'=>true];
  }

  public function changePassword(Request $req) {
    $req->validate([
      'current_password'=>'required',
      'new_password'=>[
        'required','string','min:8',
        'regex:/[A-Z]/','regex:/[0-9]/',
        'regex:/^[A-Za-z0-9!@#$%^&*._-]+$/',
      ],
    ]);

    $token = $req->bearerToken();
    $row = DB::table('owner_api_tokens')->where('token',$token)->first();
    if (!$row) return response()->json(['error'=>'unauthorized'], 401);

    $owner = DB::table('owners')->where('id',$row->owner_id)->first();
    if (!$owner || !Hash::check($req->current_password, $owner->password)) {
      return response()->json(['error'=>'invalid_current_password'], 422);
    }

    DB::table('owners')->where('id',$owner->id)->update(['password'=>Hash::make($req->new_password)]);
    return ['ok'=>true];
  }

  public function verifyEmail(Request $req) {
  if (!$req->hasValidSignature()) {
    return response()->json(['message'=>'Invalid or expired link','errors'=>[config('errorcodes.RESET_TOKEN_EXPIRED')]], 422);
  }
  $email = $req->query('email');
  $owner = DB::table('owners')->where('email',$email)->first();
  if (!$owner) {
    return response()->json(['message'=>'Unknown account','errors'=>[config('errorcodes.UNKNOWN')]], 404);
  }
  DB::table('owners')->where('id',$owner->id)->update(['email_verified_at'=>now()]);
  return view('verified'); // tiny success page, or JSON if you prefer
  }

  public function resendVerification(Request $req) {
    $req->validate(['email'=>'required|email']);
    $owner = DB::table('owners')->where('email',$req->email)->first();
    if (!$owner) {
      // Do not reveal existence—return generic OK
      return response()->json(['message'=>'OK'], 200);
    }
    if ($owner->email_verified_at) {
      return response()->json(['message'=>'Already verified'], 200);
    }
    $verifyUrl = \URL::temporarySignedRoute('auth.verify-email', now()->addMinutes(60), ['email'=>$owner->email]);
    \Mail::to($owner->email)->send(new \App\Mail\VerifyEmailMail($verifyUrl));
    return response()->json(['message'=>'OK'], 200);
  }

  public function forgot(Request $req) {
    $req->validate(['email'=>'required|email']);
    $owner = DB::table('owners')->where('email',$req->email)->first();
    // Always respond OK (avoid user enumeration)
    if ($owner) {
      $plain = Str::random(64);
      $hashed = Hash::make($plain);
      DB::table('password_reset_tokens')->updateOrInsert(
        ['email'=>$owner->email],
        ['token'=>$hashed, 'created_at'=>now()]
      );
      // Link to your SPA reset page with token+email as query
      $frontend = config('app.frontend_origin', 'http://localhost:5173');
      $resetUrl = $frontend . '/reset-password?token=' . urlencode($plain) . '&email=' . urlencode($owner->email);
      Mail::to($owner->email)->send(new PasswordResetMail($resetUrl));
    }
    return response()->json(['message'=>'OK'], 200);
  }

  public function reset(Request $req) {
    $req->validate([
      'email'=>'required|email',
      'token'=>'required',
      'new_password'=>['required','string','min:8','regex:/[A-Z]/','regex:/[0-9]/','regex:/^[A-Za-z0-9!@#$%^&*._-]+$/'],
    ]);

    $row = DB::table('password_reset_tokens')->where('email',$req->email)->first();
    if (!$row) {
      return response()->json(['message'=>'Invalid token','errors'=>[config('errorcodes.RESET_TOKEN_INVALID')]], 422);
    }
    // check age (60 minutes)
    if (!$row->created_at || now()->diffInMinutes($row->created_at) > 60) {
      return response()->json(['message'=>'Token expired','errors'=>[config('errorcodes.RESET_TOKEN_EXPIRED')]], 422);
    }
    // verify token
    if (!Hash::check($req->token, $row->token)) {
      return response()->json(['message'=>'Invalid token','errors'=>[config('errorcodes.RESET_TOKEN_INVALID')]], 422);
    }
    // update password and cleanup
    DB::table('owners')->where('email',$req->email)->update(['password'=>Hash::make($req->new_password)]);
    DB::table('password_reset_tokens')->where('email',$req->email)->delete();
    return response()->json(['message'=>'OK'], 200);
  }

}
