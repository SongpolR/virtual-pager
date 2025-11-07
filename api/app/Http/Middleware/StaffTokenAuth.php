<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class StaffTokenAuth {
  public function handle(Request $request, Closure $next) {
    $token = $request->bearerToken();
    if (!$token) return response()->json(['message'=>'Unauthorized','errors'=>[config('errorcodes.UNAUTHORIZED')]], 401);

    $row = DB::table('staff_api_tokens')->where('token', $token)->first();
    if (!$row) return response()->json(['message'=>'Unauthorized','errors'=>[config('errorcodes.UNAUTHORIZED')]], 401);

    $staff = DB::table('staff')->where('id', $row->staff_id)->first();
    if (!$staff || !$staff->is_active) {
      return response()->json(['message'=>'Unauthorized','errors'=>[config('errorcodes.UNAUTHORIZED')]], 401);
    }

    $request->attributes->set('staff_id', $staff->id);
    $request->attributes->set('shop_id', $staff->shop_id);
    DB::table('staff_api_tokens')->where('id', $row->id)->update(['last_used_at'=>now()]);
    return $next($request);
  }
}
