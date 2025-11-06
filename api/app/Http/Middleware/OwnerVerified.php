<?php
namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class OwnerVerified {
  public function handle(Request $request, Closure $next) {
    $token = $request->bearerToken();
    if (!$token) return response()->json(['message'=>'Unauthorized','errors'=>[config('errorcodes.UNAUTHORIZED')]], 401);
    $row = DB::table('owner_api_tokens')->where('token',$token)->first();
    if (!$row) return response()->json(['message'=>'Unauthorized','errors'=>[config('errorcodes.UNAUTHORIZED')]], 401);

    $owner = DB::table('owners')->where('id',$row->owner_id)->first();
    if (!$owner || !$owner->email_verified_at) {
      return response()->json([
        'message' => 'Email not verified',
        'errors'  => [config('errorcodes.EMAIL_NOT_VERIFIED')],
      ], 403);
    }
    // pass owner_id forward if needed
    $request->attributes->set('owner_id', $owner->id);
    return $next($request);
  }
}
