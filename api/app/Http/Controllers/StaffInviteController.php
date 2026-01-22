<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use App\Mail\StaffInviteMail;
use Illuminate\Validation\ValidationException;
use Illuminate\Support\Facades\Schema;

class StaffInviteController extends Controller
{
    public function create(Request $req)
    {
        try {
            $req->validate([
                'email' => 'required|email|max:190',
                'name'  => 'nullable|string|max:120',
            ]);

            $shopId = $req->attributes->get('shop_id');
            if (!$shopId) {
                return response()->json([
                    'success' => false,
                    'message' => 'UNAUTHORIZED',
                ], 401);
            }

            $email = strtolower(trim((string) $req->email));
            $name  = $req->name !== null ? trim((string) $req->name) : null;

            $shop = DB::table('shops')->where('id', $shopId)->first();
            if (!$shop) {
                return response()->json([
                    'success' => false,
                    'message' => 'SHOP_NOT_FOUND',
                ], 404);
            }

            // If staff already exists, just return OK (no user enumeration)
            // (Prefer scoping by shop_id if your schema supports it)
            $staffQ = DB::table('staffs')->where('email', $email);
            if (Schema::hasColumn('staffs', 'shop_id')) {
                $staffQ->where('shop_id', $shopId);
            }
            $staff = $staffQ->first();

            if ($staff) {
                return response()->json([
                    'success' => true,
                    'message' => 'STAFF_ALREADY_EXISTS',
                ], 200);
            }

            $token   = Str::random(48);
            $expires = now()->addHours(72);

            // Update existing invite (same shop+email) OR insert new one
            $existing = DB::table('staff_invites')
                ->where('shop_id', $shopId)
                ->where('email', $email)
                ->first();

            if ($existing) {
                DB::table('staff_invites')
                    ->where('id', $existing->id)
                    ->update([
                        'name'        => $name,
                        'token'       => $token,
                        'expires_at'  => $expires,
                        'accepted_at' => null,
                        'updated_at'  => now(),
                    ]);
            } else {
                DB::table('staff_invites')->insert([
                    'shop_id'     => $shopId,
                    'email'       => $email,
                    'name'        => $name,
                    'token'       => $token,
                    'expires_at'  => $expires,
                    'accepted_at' => null,
                    'created_at'  => now(),
                    'updated_at'  => now(),
                ]);
            }

            $frontend = rtrim(config('app.frontend_origin', 'http://localhost:5173'), '/');
            $acceptUrl = $frontend
                . '/staff-setup?token=' . urlencode($token)
                . '&email=' . urlencode($email)
                . '&shop_code=' . urlencode($shop->code);

            $options = [
                'appName'     => config('app.name'),
                'appSubtitle' => config('app.fullname'),
                'expireHours' => 72,
                'supportEmail' => config('app.support_email'),
            ];

            Mail::to($email)->send(new StaffInviteMail($acceptUrl, $shop->name, $shop->code, $options));

            return response()->json([
                'success' => true,
                'message' => 'INVITE_SENT',
            ], 200);
        } catch (ValidationException $e) {
            // Map Laravel validation rules → numeric error codes
            $map = [
                'REQUIRED' => config('errorcodes.REQUIRED_FIELD'),
                'EMAIL'    => config('errorcodes.INVALID_EMAIL'),
                'STRING'   => config('errorcodes.INVALID_FORMAT'),
                'MAX'      => config('errorcodes.TOO_LONG') ?? config('errorcodes.VALIDATION_ERROR'),
            ];

            $errors = [];
            $failed = $e->validator->failed();

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
                    'regex:/[A-Z]/',
                    'regex:/[0-9]/',
                    'regex:/^[A-Za-z0-9!@#$%^&*._-]+$/',
                ],
                'confirm_password' => 'required|string|same:password',
            ]);

            return DB::transaction(function () use ($req) {
                $invite = DB::table('staff_invites')
                    ->where(['email' => $req->email, 'token' => $req->token])
                    ->first();

                if (!$invite) {
                    return response()->json(['success' => false, 'message' => 'INVITE_INVALID'], 400);
                }
                if ($invite->accepted_at) {
                    return response()->json(['success' => false, 'message' => 'INVITE_USED'], 409);
                }
                if ($invite->expires_at && now()->greaterThan($invite->expires_at)) {
                    return response()->json(['success' => false, 'message' => 'INVITE_EXPIRED'], 410);
                }

                $staff = DB::table('staffs')
                    ->where('email', $req->email)
                    ->where('shop_id', $invite->shop_id)
                    ->first();

                if ($staff) {
                    DB::table('staffs')->where('id', $staff->id)->update([
                        'password' => Hash::make($req->password),
                        'is_active' => true,
                        'updated_at' => now(),
                    ]);
                    $staffId = $staff->id;
                } else {
                    $staffId = DB::table('staffs')->insertGetId([
                        'shop_id' => $invite->shop_id,
                        'name' => $invite->name,
                        'email' => $invite->email,
                        'password' => Hash::make($req->password),
                        'is_active' => true,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                }

                DB::table('staff_invites')->where('id', $invite->id)->update([
                    'accepted_at' => now(),
                    'updated_at' => now(),
                ]);

                $token = Str::random(64);
                DB::table('staff_api_tokens')->insert([
                    'shop_id' => $invite->shop_id,
                    'staff_id' => $staffId, // ✅ always valid
                    'token' => $token,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);

                return response()->json([
                    'success' => true,
                    'message' => 'STAFF_SETUP_SUCCESS',
                    'data' => ['token' => $token],
                ], 200);
            });
        } catch (ValidationException $e) {
            // Map Laravel validation rules → numeric error codes
            $map = [
                'REQUIRED' => config('errorcodes.REQUIRED_FIELD'),
                'EMAIL'    => config('errorcodes.INVALID_EMAIL'),
                'STRING'   => config('errorcodes.INVALID_FORMAT'),
                'MAX'      => config('errorcodes.TOO_LONG') ?? config('errorcodes.VALIDATION_ERROR'),
            ];

            $errors = [];
            $failed = $e->validator->failed();

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
        $acceptUrl = $frontend . '/staff-setup?token=' . urlencode($token) . '&email=' . urlencode($email) . '&shop_code=' . urlencode($shop->code);

        $options = [
            'appName'     => config('app.name'),
            'appSubtitle' => config('app.fullname'),
            'expireHours' => 72,
            'supportEmail' => config('app.support_email'),
        ];

        Mail::to($email)->send(new StaffInviteMail($acceptUrl, $shop->name, $shop->code, $options));

        return response()->json(['success' => true, 'message' => 'OK'], 200);
    }
}
