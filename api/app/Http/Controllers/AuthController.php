<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class AuthController extends Controller
{
  public function signup(Request $req) {
    try {
      $req->validate([
        'name' => 'required|string|max:120',
        'email' => 'required|email|max:190|unique:owners,email',
        'password' => [
          'required','string','min:8',
          'regex:/[A-Z]/',                     // at least one uppercase
          'regex:/[0-9]/',                     // at least one number
          'regex:/^[A-Za-z0-9!@#$%^&*._-]+$/', // allowed chars only
        ],
        'shop_name' => 'required|string|max:120',
        'logo' => 'nullable|image|max:2048', // ≤2MB
      ]);

      // resolution limit ≤ 1024×1024
      if ($req->hasFile('logo')) {
        [$w,$h] = getimagesize($req->file('logo')->getPathname());
        if ($w > 1024 || $h > 1024) {
          return response()->json(['error'=>'logo_resolution_too_large'], 422);
        }
      }

      return DB::transaction(function () use ($req) {
        $ownerId = DB::table('owners')->insertGetId([
          'name'=>$req->name,
          'email'=>$req->email,
          'password'=>Hash::make($req->password),
          'created_at'=>now(),'updated_at'=>now(),
        ]);

        $logoUrl = null;
        if ($req->hasFile('logo')) {
          $path = $req->file('logo')->store('public/logos');
          $logoUrl = Storage::url($path); // needs storage:link
        }

        DB::table('shops')->insert([
          'owner_id'=>$ownerId,
          'name'=>$req->shop_name,
          'logo_url'=>$logoUrl,
          'order_mode'=>'SEQUENTIAL',
          'seq_next'=>1,
          'random_min'=>100,'random_max'=>999,
          'sound_key'=>'ding',
          'created_at'=>now(),'updated_at'=>now(),
        ]);

        $token = Str::random(64);
        DB::table('owner_api_tokens')->insert([
          'owner_id'=>$ownerId,'token'=>$token,
          'created_at'=>now(),'updated_at'=>now(),
        ]);

        return ['token'=>$token];
      });
    } catch (\Illuminate\Validation\ValidationException $e) {
      $codes = [];
        foreach ($e->errors() as $field => $messages) {
            foreach ($messages as $msg) {
                if (str_contains($msg, 'taken')) $codes[] = config('errorcodes.EMAIL_TAKEN');
                elseif (str_contains($msg, 'required')) $codes[] = config('errorcodes.REQUIRED_FIELD');
                elseif (str_contains($msg, 'valid')) $codes[] = config('errorcodes.INVALID_FORMAT');
                else $codes[] = config('errorcodes.UNKNOWN');
            }
        }

        return response()->json([
            'message' => 'Validation failed',
            'errors'  => array_values(array_unique($codes)),
        ], 422);
    } catch (\Illuminate\Database\QueryException $e) {
      if (str_contains($e->getMessage(), 'Duplicate')) {
            return response()->json([
                'message' => 'Email already registered',
                'errors'  => [config('errorcodes.EMAIL_TAKEN')],
            ], 422);
        }
        throw $e;
    }
  }

  public function login(Request $req) {
    $req->validate(['email'=>'required|email', 'password'=>'required']);
    $owner = DB::table('owners')->where('email',$req->email)->first();
    if (!$owner || !Hash::check($req->password, $owner->password)) {
      return response()->json(['error'=>'invalid_credentials'], 401);
    }
    $token = Str::random(64);
    DB::table('owner_api_tokens')->insert([
      'owner_id'=>$owner->id,'token'=>$token,'created_at'=>now(),'updated_at'=>now()
    ]);
    return ['token'=>$token];
  }

  public function logout(Request $req) {
    $token = $req->bearerToken();
    if ($token) DB::table('owner_api_tokens')->where('token',$token)->delete();
    return ['ok'=>true];
  }

  public function changePassword(Request $req) {
    $req->validate([
      'current_password'=>'required',
      'new_password'=>[
        'required','string','min:8',
        'regex:/[A-Z]/','regex:/[0-9]/',
        'regex:/^[A-Za-z0-9!@#$%^&*._-]+$/',
      ],
    ]);

    $token = $req->bearerToken();
    $row = DB::table('owner_api_tokens')->where('token',$token)->first();
    if (!$row) return response()->json(['error'=>'unauthorized'], 401);

    $owner = DB::table('owners')->where('id',$row->owner_id)->first();
    if (!$owner || !Hash::check($req->current_password, $owner->password)) {
      return response()->json(['error'=>'invalid_current_password'], 422);
    }

    DB::table('owners')->where('id',$owner->id)->update(['password'=>Hash::make($req->new_password)]);
    return ['ok'=>true];
  }
}
