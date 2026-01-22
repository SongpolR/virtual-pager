<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Validation\ValidationException;

class StaffPasswordResetController extends Controller
{
    // PUBLIC: staff initiates reset (opaque: always 200)
    public function initiate(Request $req)
    {
        $req->validate(['email' => 'required|email']);
        $email = $req->email;

        $staff = DB::table('staffs')->where('email', $email)->first();

        if ($staff && $staff->is_active) {
            $plain  = \Illuminate\Support\Str::random(64);
            $hashed = Hash::make($plain);

            DB::table('staff_password_reset_tokens')->updateOrInsert(
                ['email' => $email],
                ['token' => $hashed, 'created_at' => now()]
            );

            $frontend = config('app.frontend_origin', 'http://localhost:5173');
            $shop = DB::table('shops')->where('id', $staff->shop_id)->first();
            $resetUrl = $frontend . '/staff-reset-password?token=' . urlencode($plain) . '&email=' . urlencode($email) . '&shop_code=' . urlencode($shop->code);

            $options = [
                'appName'     => config('app.name'),
                'appSubtitle' => config('app.fullname'),
                'expireMinutes' => 60,
                'supportEmail' => config('app.support_email'),
            ];
            Mail::to($email)->send(new \App\Mail\StaffResetPasswordMail($resetUrl, $shop->name, $shop->code, $options));
        }

        // Always OK to avoid account enumeration
        return response()->json(['success' => true, 'message' => 'OK'], 200);
    }

    // PUBLIC: staff submits new password with token
    public function perform(Request $req)
    {
        try {
            $req->validate([
                'email' => 'required|email',
                'token' => 'required',
                'new_password' => [
                    'required',
                    'string',
                    'min:8',
                    'regex:/[A-Z]/',                        // at least one uppercase
                    'regex:/[0-9]/',                        // at least one number
                    'regex:/^[A-Za-z0-9!@#$%^&*._-]+$/',    // allowed chars
                ],
            ]);

            $row = DB::table('staff_password_reset_tokens')
                ->where('email', $req->email)
                ->first();

            // No reset request found for this email
            if (!$row) {
                return response()->json([
                    'success' => false,
                    'message' => 'RESET_TOKEN_INVALID',
                ], 400);
            }

            // Expired (older than 60 minutes or missing created_at)
            if (!$row->created_at || now()->diffInMinutes($row->created_at) > 60) {
                return response()->json([
                    'success' => false,
                    'message' => 'RESET_TOKEN_EXPIRED',
                ], 410);
            }

            // Token mismatch
            if (!Hash::check($req->token, $row->token)) {
                return response()->json([
                    'success' => false,
                    'message' => 'RESET_INVALID',
                ], 400);
            }

            // Update staff password
            $updated = DB::table('staffs')
                ->where('email', $req->email)
                ->update([
                    'password'   => Hash::make($req->new_password),
                    'updated_at' => now(),
                ]);

            // Optional: if no staff row updated → account not found
            if ($updated === 0) {
                return response()->json([
                    'success' => false,
                    'message' => 'ACCOUNT_NOT_FOUND',
                ], 404);
            }

            // Cleanup reset token
            DB::table('staff_password_reset_tokens')
                ->where('email', $req->email)
                ->delete();

            return response()->json([
                'success' => true,
                'message' => 'RESET_SUCCESS',
            ], 200);
        } catch (ValidationException $e) {
            // Map Laravel validation rules → numeric error codes in config/errorcodes.php
            $map = [
                'REQUIRED' => config('errorcodes.REQUIRED_FIELD'),
                'EMAIL'    => config('errorcodes.INVALID_EMAIL'),
                'STRING'   => config('errorcodes.INVALID_FORMAT'),
                'MIN'      => config('errorcodes.TOO_SHORT'),
                'REGEX'    => config('errorcodes.INVALID_FORMAT'),
            ];

            $errors  = [];
            $failed  = $e->validator->failed(); // field => [rule => params]

            foreach ($failed as $field => $rules) {
                foreach ($rules as $rule => $params) {
                    $key  = strtoupper($rule);
                    $code = $map[$key] ?? config('errorcodes.VALIDATION_ERROR');

                    $meta = [];
                    if ($key === 'MIN' && isset($params[0])) {
                        $meta['min'] = $params[0];
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
