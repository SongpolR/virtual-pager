<?php

namespace App\Http\Controllers;

use App\Models\Order;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class OrderController extends Controller
{
    public function show($orderNo) {
        $o = Order::where('order_no', $orderNo)->firstOrFail();
        return ['order_no' => $o->order_no, 'status' => $o->status];
    }

    public function store(Request $req) {
        $shop = DB::table('shops')->where('id',1)->first();
        if (!$shop) return response()->json(['message'=>'no_shop','errors'=>[1999]], 400);

        // DAILY reset check
        if ($shop->seq_reset_policy === 'DAILY') {
            $tz = new \DateTimeZone($shop->timezone ?: 'Asia/Bangkok');
            $today = now($tz)->toDateString();
            if ($shop->last_seq_reset_date !== $today) {
            DB::table('shops')->where('id', $shop->id)->update([
                'seq_next' => $shop->seq_start ?? 1,
                'last_seq_reset_date' => $today,
                'updated_at' => now(),
            ]);
            // refresh in-memory
            $shop = DB::table('shops')->where('id',1)->first();
            }
        }

        if ($shop->order_mode === 'SEQUENTIAL') {
            $orderNo = str_pad($shop->seq_next, 3, '0', STR_PAD_LEFT);
            DB::table('shops')->where('id',1)->update(['seq_next' => $shop->seq_next + 1]);
        } else {
            $min=(int)$shop->random_min; $max=(int)$shop->random_max;
            $orderNo=(string)random_int($min,$max);
        }

        $o = Order::create([
            'shop_id'=>1, 'order_no'=>$orderNo, 'status'=>'PREPARING',
        ]);

        return ['ok'=>true,'order'=>$o];
    }

}