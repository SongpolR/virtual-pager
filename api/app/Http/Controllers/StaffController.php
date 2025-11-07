<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class StaffController extends Controller
{
    /**
     * List staff for the (single) shop.
     * Owner-only (protect via middleware: ['owner','verified'])
     */
    public function list()
    {
        // MVP: single-shop
        $shop = DB::table('shops')->first();
        if (!$shop) {
            return response()->json([
                'message' => 'No shop found',
                'errors'  => [config('errorcodes.UNKNOWN')],
            ], 400);
        }

        $rows = DB::table('staff')
            ->where('shop_id', $shop->id)
            ->orderByDesc('id')
            ->get();

        return response()->json($rows);
    }

    /**
     * Create a staff account (owner provisions).
     * Owner-only (protect via middleware: ['owner','verified'])
     */
    public function create(Request $req)
    {
        try {
            $req->validate([
                'name'     => 'nullable|string|max:120',
                'email'    => 'required|email|max:190|unique:staff,email',
                'password' => [
                    'required',
                    'string',
                    'min:8',
                    'regex:/[A-Z]/',          // at least one uppercase
                    'regex:/[0-9]/',          // at least one number
                    'regex:/^[A-Za-z0-9!@#$%^&*._-]+$/', // allowed chars
                ],
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            // Keep it simple: return generic validation error code
            return response()->json([
                'message' => 'Validation failed',
                'errors'  => [config('errorcodes.VALIDATION_ERROR')],
            ], 422);
        }

        $shop = DB::table('shops')->first();
        if (!$shop) {
            return response()->json([
                'message' => 'No shop found',
                'errors'  => [config('errorcodes.UNKNOWN')],
            ], 400);
        }

        // Create staff
        $id = DB::table('staff')->insertGetId([
            'shop_id'    => $shop->id,
            'name'       => $req->input('name'),
            'email'      => $req->input('email'),
            'password'   => Hash::make($req->input('password')),
            'is_active'  => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return response()->json(['id' => $id], 201);
    }

    /**
     * Deactivate a staff account (soft lock).
     * Owner-only (protect via middleware: ['owner','verified'])
     */
    public function deactivate($id)
    {
        $affected = DB::table('staff')
            ->where('id', $id)
            ->update([
                'is_active'  => false,
                'updated_at' => now(),
            ]);

        if (!$affected) {
            return response()->json([
                'message' => 'Account not found',
                'errors'  => [config('errorcodes.ACCOUNT_NOT_FOUND')],
            ], 404);
        }

        return response()->json(['ok' => true]);
    }

    /**
     * Staff login with email/password.
     * Public route (no auth) → returns staff API token on success.
     */
    public function login(Request $req)
    {
        try {
            $req->validate(['email' => 'required|email', 'password' => 'required|string']);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed',
                'errors'  => [config('errorcodes.VALIDATION_ERROR')],
            ], 422);
        }

        $email  = $req->email;
        $staff  = DB::table('staff')->where('email', $email)->first();
        $invite = DB::table('staff_invites')
            ->where('email', $email)
            ->whereNull('accepted_at')
            ->first();

        // Case 1: no staff & no invite → contact owner
        if (!$staff && !$invite) {
            return response()->json([
                'message' => 'Account not found',
                'errors'  => [config('errorcodes.ACCOUNT_NOT_FOUND')], // 1007
            ], 404);
        }

        // Case 2: invite exists, staff not created/activated → link to activate
        if (!$staff && $invite) {
            return response()->json([
                'message' => 'Invite pending',
                'errors'  => [config('errorcodes.INVITE_PENDING')], // 1403
            ], 403);
        }

        // Case 3: staff exists (invite may also exist but already used or still present)
        if (!$staff->is_active) {
            return response()->json([
                'message' => 'Staff inactive',
                'errors'  => [config('errorcodes.STAFF_INACTIVE')], // 1300
            ], 403);
        }

        if (!Hash::check($req->password, $staff->password ?? '')) {
            return response()->json([
                'message' => 'Invalid credentials',
                'errors'  => [config('errorcodes.INVALID_CREDENTIAL')], // 1003
            ], 401);
        }

        // OK → issue staff token
        $token = Str::random(64);
        DB::table('staff_api_tokens')->insert([
            'staff_id'   => $staff->id,
            'token'      => $token,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return response()->json(['token' => $token], 200);
    }
}
