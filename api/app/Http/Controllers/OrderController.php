<?php

namespace App\Http\Controllers;

use App\Models\Order;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class OrderController extends Controller
{
    public function show($orderNo) {
        $o = Order::where('order_no', $orderNo)->firstOrFail();
        return ['order_no' => $o->order_no, 'status' => $o->status];
    }
}