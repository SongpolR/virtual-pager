<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use App\Mail\StaffInviteMail;

class StaffInviteController extends Controller
{
    /**
     * Owner sends staff invite email
     */
    public function create(Request $req)
    {
        $req->validate([
            'email' => 'required|email|max:190',
            'name'  => 'nullable|string|max:120',
        ]);

        // For MVP, assume single shop per owner
        $shop = DB::table('shops')->first();
        if (!$shop) {
            return response()->json([
                'message' => 'No shop found',
                'errors'  => [1999],
            ], 400);
        }

        // If staff already exists, just return OK
        $staff = DB::table('staff')->where('email', $req->email)->first();
        if ($staff) {
            return response()->json(['message' => 'OK'], 200);
        }

        // Create or update invite
        $token   = Str::random(48);
        $expires = now()->addHours(72);

        DB::table('staff_invites')->updateOrInsert(
            ['email' => $req->email, 'shop_id' => $shop->id],
            [
                'name'         => $req->name,
                'token'        => $token,
                'expires_at'   => $expires,
                'accepted_at'  => null,
                'updated_at'   => now(),
                'created_at'   => now(),
            ]
        );

        $frontend = config('app.frontend_origin', 'http://localhost:5173');
        $acceptUrl = $frontend . '/staff-setup?token=' . urlencode($token) . '&email=' . urlencode($req->email);

        Mail::to($req->email)->send(new StaffInviteMail($acceptUrl, $shop->name));

        return response()->json(['message' => 'OK'], 200);
    }

    /**
     * Staff accepts invite and sets password
     */
    public function accept(Request $req)
    {
        $req->validate([
            'email' => 'required|email',
            'token' => 'required|string',
            'password' => [
                'required',
                'string',
                'min:8',
                'regex:/[A-Z]/', // at least one uppercase
                'regex:/[0-9]/', // at least one number
                'regex:/^[A-Za-z0-9!@#$%^&*._-]+$/', // allowed chars
            ],
        ]);

        $invite = DB::table('staff_invites')
            ->where(['email' => $req->email, 'token' => $req->token])
            ->first();

        if (!$invite) {
            return response()->json([
                'message' => 'Invalid invite',
                'errors'  => [config('errorcodes.INVITE_INVALID')],
            ], 422);
        }

        if ($invite->accepted_at) {
            return response()->json([
                'message' => 'Invite already used',
                'errors'  => [config('errorcodes.INVITE_USED')],
            ], 422);
        }

        if ($invite->expires_at && now()->greaterThan($invite->expires_at)) {
            return response()->json([
                'message' => 'Invite expired',
                'errors'  => [config('errorcodes.INVITE_EXPIRED')],
            ], 422);
        }

        // Create or update staff record
        $staff = DB::table('staff')->where('email', $req->email)->first();

        if ($staff) {
            DB::table('staff')->where('id', $staff->id)->update([
                'password'  => Hash::make($req->password),
                'is_active' => true,
                'updated_at' => now(),
            ]);
        } else {
            DB::table('staff')->insert([
                'shop_id'    => $invite->shop_id,
                'name'       => $invite->name,
                'email'      => $invite->email,
                'password'   => Hash::make($req->password),
                'is_active'  => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
            $staff = DB::table('staff')->where('email', $req->email)->first();
        }

        // Mark invite as used
        DB::table('staff_invites')->where('id', $invite->id)->update([
            'accepted_at' => now(),
            'updated_at'  => now(),
        ]);

        // Auto-login: issue API token
        $token = Str::random(64);
        DB::table('staff_api_tokens')->insert([
            'staff_id'   => $staff->id,
            'token'      => $token,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return response()->json([
            'message' => 'OK',
            'token'   => $token,
        ], 200);
    }

    public function resendByOwner(Request $req)
    {
        $req->validate(['email' => 'required|email']);
        $email = $req->email;

        $invite = DB::table('staff_invites')
            ->where('email', $email)
            ->whereNull('accepted_at')
            ->first();

        // Idempotent OK
        if (!$invite) {
            return response()->json(['message' => 'OK'], 200);
        }

        // Refresh token + extend expiry
        $token   = \Illuminate\Support\Str::random(48);
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

        return response()->json(['message' => 'OK'], 200);
    }
}
