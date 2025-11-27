<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use App\Mail\StaffInviteMail;
use Illuminate\Validation\ValidationException;

class StaffInviteController extends Controller
{
    public function create(Request $req)
    {
        try {
            $req->validate([
                'email' => 'required|email|max:190',
                'name'  => 'nullable|string|max:120',
            ]);

            // For MVP, assume single shop per owner
            $shop = DB::table('shops')->first();
            if (!$shop) {
                return response()->json([
                    'success' => false,
                    'message' => 'SHOP_NOT_FOUND', // front-end can map errors.SHOP_NOT_FOUND
                ], 404);
            }

            // If staff already exists, just return OK (no user enumeration)
            // NOTE: Use "staffs" to be consistent with staff login query
            $staff = DB::table('staffs')->where('email', $req->email)->first();
            if ($staff) {
                return response()->json([
                    'success' => true,
                    'message' => 'STAFF_ALREADY_EXISTS', // optional code if you want to differentiate
                ], 200);
            }

            // Create or update invite
            $token   = Str::random(48);
            $expires = now()->addHours(72);

            DB::table('staff_invites')->updateOrInsert(
                ['email' => $req->email, 'shop_id' => $shop->id],
                [
                    'name'        => $req->name,
                    'token'       => $token,
                    'expires_at'  => $expires,
                    'accepted_at' => null,
                    'updated_at'  => now(),
                    'created_at'  => now(),
                ]
            );

            $frontend  = config('app.frontend_origin', 'http://localhost:5173');
            $acceptUrl = $frontend
                . '/staff-setup?token=' . urlencode($token)
                . '&email=' . urlencode($req->email);

            Mail::to($req->email)->send(new StaffInviteMail($acceptUrl, $shop->name));

            return response()->json([
                'success' => true,
                'message' => 'INVITE_SENT',
            ], 200);
        } catch (ValidationException $e) {
            // Map Laravel validation rules → numeric error codes in config/errorcodes.php
            $map = [
                'REQUIRED' => config('errorcodes.REQUIRED_FIELD'),
                'EMAIL'    => config('errorcodes.INVALID_EMAIL'),
                'STRING'   => config('errorcodes.INVALID_FORMAT'),
                'MAX'      => config('errorcodes.TOO_LONG')  ?? config('errorcodes.VALIDATION_ERROR'),
            ];

            $errors = [];
            $failed = $e->validator->failed(); // field => [rule => params]

            foreach ($failed as $field => $rules) {
                foreach ($rules as $rule => $params) {
                    $key  = strtoupper($rule);
                    $code = $map[$key] ?? config('errorcodes.VALIDATION_ERROR');

                    $meta = [];
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

    public function accept(Request $req)
    {
        try {
            $req->validate([
                'email' => 'required|email',
                'token' => 'required|string',
                'password' => [
                    'required',
                    'string',
                    'min:8',
                    'regex:/[A-Z]/',                        // at least one uppercase
                    'regex:/[0-9]/',                        // at least one number
                    'regex:/^[A-Za-z0-9!@#$%^&*._-]+$/',    // allowed chars
                ],
            ]);

            $invite = DB::table('staff_invites')
                ->where([
                    'email' => $req->email,
                    'token' => $req->token,
                ])
                ->first();

            if (!$invite) {
                return response()->json([
                    'success' => false,
                    'message' => 'INVITE_INVALID',
                ], 400);
            }

            if ($invite->accepted_at) {
                return response()->json([
                    'success' => false,
                    'message' => 'INVITE_USED',
                ], 409);
            }

            if ($invite->expires_at && now()->greaterThan($invite->expires_at)) {
                return response()->json([
                    'success' => false,
                    'message' => 'INVITE_EXPIRED',
                ], 410);
            }

            // Create or update staff record
            // NOTE: use "staffs" to be consistent with other code
            $staff = DB::table('staffs')->where('email', $req->email)->first();

            if ($staff) {
                DB::table('staffs')->where('id', $staff->id)->update([
                    'password'   => Hash::make($req->password),
                    'is_active'  => true,
                    'updated_at' => now(),
                ]);
            } else {
                DB::table('staffs')->insert([
                    'shop_id'    => $invite->shop_id,
                    'name'       => $invite->name,
                    'email'      => $invite->email,
                    'password'   => Hash::make($req->password),
                    'is_active'  => true,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);

                $staff = DB::table('staffs')->where('email', $req->email)->first();
            }

            // Mark invite as used
            DB::table('staff_invites')->where('id', $invite->id)->update([
                'accepted_at' => now(),
                'updated_at'  => now(),
            ]);

            // Auto-login: issue API token
            $token = Str::random(64);
            DB::table('staff_api_tokens')->insert([
                'staff_id'   => 1,
                'token'      => $token,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            return response()->json([
                'success' => true,
                'message' => 'STAFF_SETUP_SUCCESS',
                'data'    => [
                    'token' => $token,
                ],
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

    public function resendByOwner(Request $req)
    {
        $req->validate(['email' => 'required|email']);
        $email = $req->email;

        $invite = DB::table('staff_invites')
            ->where('email', $email)
            ->first();

        // Idempotent OK
        if (!$invite) {
            return response()->json(['message' => 'OK'], 200);
        }

        // Refresh token + extend expiry
        $token   = Str::random(48);
        $expires = now()->addHours(72);

        DB::table('staff_invites')->where('id', $invite->id)->update([
            'token'      => $token,
            'expires_at' => $expires,
            'updated_at' => now(),
        ]);

        $shop = DB::table('shops')->where('id', $invite->shop_id)->first();
        $frontend = config('app.frontend_origin', 'http://localhost:5173');
        $acceptUrl = $frontend . '/staff-setup?token=' . urlencode($token) . '&email=' . urlencode($email);

        Mail::to($email)->send(new StaffInviteMail($acceptUrl, $shop?->name ?? 'Your Shop'));

        return response()->json(['success' => true, 'message' => 'OK'], 200);
    }
}
