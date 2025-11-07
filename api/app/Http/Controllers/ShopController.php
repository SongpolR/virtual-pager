<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;

class ShopController extends Controller
{
  public function show() {
    $shop = DB::table('shops')->first();
    return $shop ?: response()->json(['error'=>'no_shop'], 404);
  }

  public function update(Request $req) {
    $req->validate([
      'name' => 'sometimes|string|max:120',
      'order_mode' => ['sometimes', Rule::in(['SEQUENTIAL','RANDOM'])],
      'seq_next' => 'sometimes|integer|min:1',
      'random_min' => 'sometimes|integer|min:1',
      'random_max' => 'sometimes|integer|min:1|gte:random_min',
      'sound_key' => ['sometimes', Rule::in(['ding','bell','chime','ping','beep'])],
      'seq_start' => 'sometimes|integer|min:1',
      'seq_reset_policy' => ['sometimes', Rule::in(['NONE','DAILY'])],
      'timezone' => 'sometimes|string|max:64',
    ]);

    DB::table('shops')->where('id',1)->update(array_merge(
      $req->only(['name','order_mode','seq_next','random_min','random_max','sound_key']),
      ['updated_at'=>now()]
    ));

    return DB::table('shops')->where('id',1)->first();
  }

  public function uploadLogo(Request $req) {
    $req->validate(['logo'=>'required|image|max:2048']);
    [$w,$h] = getimagesize($req->file('logo')->getPathname());
    if ($w > 1024 || $h > 1024) {
      return response()->json(['error'=>'logo_resolution_too_large'], 422);
    }
    $path = $req->file('logo')->store('public/logos');
    $url = Storage::url($path);
    DB::table('shops')->where('id',1)->update(['logo_url'=>$url, 'updated_at'=>now()]);
    return ['logo_url'=>$url];
  }
}
