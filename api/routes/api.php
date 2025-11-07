<?php

use Illuminate\Support\Facades\Route;

// Controllers
use App\Http\Controllers\AuthController;
use App\Http\Controllers\GoogleAuthController;
use App\Http\Controllers\ShopController;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\StaffController;
use App\Http\Controllers\StaffInviteController;
use App\Http\Controllers\StaffPasswordResetController;

/*
|--------------------------------------------------------------------------
| Public / No Auth
|--------------------------------------------------------------------------
*/

// Basic health check
Route::get('/health', function () {
  return response()->json(['ok' => true]);
});

// Owner auth (email/password)
Route::post('/auth/signup', [AuthController::class, 'signup']); // creates owner + shop, sends verify email (no token)
Route::post('/auth/login',  [AuthController::class, 'login']);  // requires email_verified_at

// Email verification (owner)
Route::get('/auth/verify-email', [AuthController::class, 'verifyEmail'])->name('auth.verify-email'); // signed URL landing
Route::post('/auth/resend-verification', [AuthController::class, 'resendVerification']); // opaque 200

// Optional: Google Sign-in for owner (keep if you wired it)
Route::get('/auth/google/redirect', [GoogleAuthController::class, 'redirect']);
Route::get('/auth/google/callback', [GoogleAuthController::class, 'callback']);

// Staff: accept invite (activate & auto-login token returned)
Route::post('/staff/accept', [StaffInviteController::class, 'accept']);

// Staff: password reset (self-service AFTER activation, always opaque 200 on initiate)
Route::post('/staff/forgot', [StaffPasswordResetController::class, 'initiate']); // send reset email if active
Route::post('/staff/reset',  [StaffPasswordResetController::class, 'perform']);  // submit new password w/ token

// Staff: login (handles 3 cases: no account, invite pending, wrong password)
Route::post('/staff/login',  [StaffController::class, 'login']);


/*
|--------------------------------------------------------------------------
| Owner-only (must be authenticated owner + verified email)
| Middleware aliases are registered in bootstrap/app.php:
|   'owner'    => \App\Http\Middleware\OwnerTokenAuth::class
|   'verified' => \App\Http\Middleware\OwnerVerified::class
|--------------------------------------------------------------------------
*/
Route::middleware(['owner', 'verified'])->group(function () {
  // Shop settings (profile, logo, order numbering policy, sound, etc.)
  Route::get('/shop',  [ShopController::class, 'show']);
  Route::put('/shop',  [ShopController::class, 'update']); // expect multipart/form-data for logo if provided

  // Staff management (owner provisions)
  Route::get('/staff',                  [StaffController::class, 'list']);
  Route::post('/staff',                 [StaffController::class, 'create']);      // optional direct create
  Route::post('/staff/{id}/deactivate', [StaffController::class, 'deactivate']);

  // Staff invitations (owner controls activation)
  Route::post('/staff/invite',         [StaffInviteController::class, 'create']);        // send invite
  Route::post('/staff/invite/resend',  [StaffInviteController::class, 'resendByOwner']); // resend pending invite

  // (Optional) Owner may also trigger a staff reset email via the same public endpoint server-side,
  // or you can create an owner-scoped proxy if you prefer strict separation.
});


/*
|--------------------------------------------------------------------------
| Owner OR Staff (either token) — operational endpoints
| Middleware alias 'any' allows owner OR active staff:
|   'any' => \App\Http\Middleware\AnyTokenAuth::class
|--------------------------------------------------------------------------
*/
Route::middleware('any')->group(function () {
  // Orders (create → ready → done)
  Route::get('/orders',                        [OrderController::class, 'index']);
  Route::post('/orders',                       [OrderController::class, 'store']);  // applies daily reset policy
  Route::post('/orders/{orderNo}/ready',       [OrderController::class, 'ready']);
  Route::post('/orders/{orderNo}/done',        [OrderController::class, 'done']);
});
