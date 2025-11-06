<?php

namespace App\Http\Controllers;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Http\Request;
use Laravel\Socialite\Facades\Socialite;

class GoogleAuthController extends Controller
{
    public function redirect()
    {
        // stateless popup-friendly
        return Socialite::driver('google')
            ->stateless()
            ->scopes(['openid','profile','email'])
            ->redirect();
    }

    public function callback(Request $req)
    {
        try {
            $google = Socialite::driver('google')->stateless()->user();
        } catch (\Throwable $e) {
            return $this->popupCloseWithError(config('errorcodes.OAUTH_FAILED'), 'OAuth failed');
        }

        $email = $google->getEmail();
        $name  = $google->getName() ?: 'Owner';

        if (!$email) {
            return $this->popupCloseWithError(config('errorcodes.OAUTH_NO_EMAIL'), 'No email returned by Google');
        }

        // Find or create owner
        $owner = DB::table('owners')->where('email', $email)->first();
        if (!$owner) {
            // Provision owner + default shop
            $ownerId = DB::table('owners')->insertGetId([
                'name' => $name,
                'email' => $email,
                'password' => null, // using Google
                'email_verified_at'=>now(), // 👈 mark verified 
                'created_at'=>now(),'updated_at'=>now(),
            ]);

            DB::table('shops')->insert([
                'owner_id'=>$ownerId,
                'name'=>'My Cafe',
                'logo_url'=>null,
                'order_mode'=>'SEQUENTIAL',
                'seq_next'=>1,
                'random_min'=>100,'random_max'=>999,
                'sound_key'=>'ding',
                'created_at'=>now(),'updated_at'=>now(),
            ]);

            $owner = DB::table('owners')->where('id',$ownerId)->first();
        }else if (!$owner->email_verified_at) {
            DB::table('owners')->where('id', $owner->id)->update(['email_verified_at'=>now()]);
            $owner = DB::table('owners')->where('id',$owner->id)->first();
        }

        // Issue token
        $token = Str::random(64);
        DB::table('owner_api_tokens')->insert([
            'owner_id'=>$owner->id,
            'token'=>$token,
            'created_at'=>now(),'updated_at'=>now(),
        ]);

        // Return a minimal HTML that postMessages the token to opener and closes
        return response()->view('oauth-callback', ['token' => $token]);
    }

    private function popupCloseWithError(int $code, string $message)
    {
        return response()->view('oauth-callback', [
            'error' => ['message' => $message, 'errors' => [$code]],
        ]);
    }
}
