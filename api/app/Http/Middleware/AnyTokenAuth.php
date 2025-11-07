<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AnyTokenAuth
{
  public function handle(Request $request, Closure $next)
  {
    $token = $request->bearerToken();
    if (!$token) return response()->json(['message' => 'Unauthorized', 'errors' => [config('errorcodes.UNAUTHORIZED')]], 401);

    // Try owner token
    $o = DB::table('owner_api_tokens')->where('token', $token)->first();
    if ($o) {
      $owner = DB::table('owners')->where('id', $o->owner_id)->first();
      if ($owner) {
        // shop_id=1 if single-shop; adjust if multi-shop later
        $shop = DB::table('shops')->where('owner_id', $owner->id)->first();
        $request->attributes->set('owner_id', $owner->id);
        $request->attributes->set('shop_id', $shop?->id ?? 1);
        return $next($request);
      }
    }

    // Try staff token
    $s = DB::table('staff_api_tokens')->where('token', $token)->first();
    if ($s) {
      $staff = DB::table('staff')->where('id', $s->staff_id)->first();
      if ($staff && $staff->is_active) {
        $request->attributes->set('staff_id', $staff->id);
        $request->attributes->set('shop_id', $staff->shop_id);
        return $next($request);
      }
    }

    return response()->json(['message' => 'Unauthorized', 'errors' => [config('errorcodes.UNAUTHORIZED')]], 401);
  }
}
