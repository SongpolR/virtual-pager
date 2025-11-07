<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;

class StaffPasswordResetController extends Controller
{
    // PUBLIC: staff initiates reset (opaque: always 200)
    public function initiate(Request $req)
    {
        $req->validate(['email' => 'required|email']);
        $email = $req->email;

        $staff = DB::table('staff')->where('email', $email)->first();

        if ($staff && $staff->is_active) {
            $plain  = \Illuminate\Support\Str::random(64);
            $hashed = Hash::make($plain);

            DB::table('staff_password_reset_tokens')->updateOrInsert(
                ['email' => $email],
                ['token' => $hashed, 'created_at' => now()]
            );

            $frontend = config('app.frontend_origin', 'http://localhost:5173');
            $shop = DB::table('shops')->where('id', $staff->shop_id)->first();
            $resetUrl = $frontend . '/staff-reset?token=' . urlencode($plain) . '&email=' . urlencode($email);

            Mail::to($email)->send(new \App\Mail\StaffPasswordResetMail($resetUrl, $shop?->name ?? 'Your Shop'));
        }

        // Always OK to avoid account enumeration
        return response()->json(['message' => 'OK'], 200);
    }

    // PUBLIC: staff submits new password with token
    public function perform(Request $req)
    {
        $req->validate([
            'email' => 'required|email',
            'token' => 'required',
            'new_password' => [
                'required',
                'string',
                'min:8',
                'regex:/[A-Z]/',
                'regex:/[0-9]/',
                'regex:/^[A-Za-z0-9!@#$%^&*._-]+$/'
            ],
        ]);

        $row = DB::table('staff_password_reset_tokens')->where('email', $req->email)->first();
        if (!$row) {
            return response()->json(['message' => 'Invalid token', 'errors' => [config('errorcodes.RESET_INVALID')]], 422);
        }
        if (!$row->created_at || now()->diffInMinutes($row->created_at) > 60) {
            return response()->json(['message' => 'Token expired', 'errors' => [config('errorcodes.RESET_EXPIRED')]], 422);
        }
        if (!Hash::check($req->token, $row->token)) {
            return response()->json(['message' => 'Invalid token', 'errors' => [config('errorcodes.RESET_INVALID')]], 422);
        }

        DB::table('staff')->where('email', $req->email)->update([
            'password' => Hash::make($req->new_password),
            'updated_at' => now(),
        ]);
        DB::table('staff_password_reset_tokens')->where('email', $req->email)->delete();

        return response()->json(['message' => 'OK'], 200);
    }
}
