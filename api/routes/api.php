<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Route;
use App\Models\Order;

Route::get('/health', fn() => ['ok' => true]);

Route::get('/orders', function () {
    return Order::latest()->limit(100)->get();
});

Route::post('/orders', function (Request $req) {
    // You could accept an order number from POS; otherwise generate a short one
    $orderNo = str_pad((string)random_int(1, 999), 3, '0', STR_PAD_LEFT);
    $o = Order::create([
        'order_no' => $orderNo,
        'status' => 'PREPARING',
    ]);
    return ['ok' => true, 'order' => $o];
});

Route::post('/orders/{orderNo}/ready', function ($orderNo) {
    $o = Order::where('order_no', $orderNo)->firstOrFail();
    $o->status = 'READY';
    $o->save();

    // emit to Socket.IO
    Http::withToken(config('app.realtime_secret'))
        ->post(config('app.realtime_url') . '/emit', [
            'event' => 'order:status',
            'orderNo' => $o->order_no,
            'payload' => ['status' => $o->status],
        ])->throw();

    return ['ok' => true];
});

Route::post('/orders/{orderNo}/done', function ($orderNo) {
    $o = Order::where('order_no', $orderNo)->firstOrFail();
    $o->status = 'DONE';
    $o->save();

    Http::withToken(config('app.realtime_secret'))
        ->post(config('app.realtime_url') . '/emit', [
            'event' => 'order:status',
            'orderNo' => $o->order_no,
            'payload' => ['status' => $o->status],
        ])->throw();

    return ['ok' => true];
});

// Optional: signed short URL (QR landing) you can serve via React routing
Route::get('/orders/{orderNo}/signed-url', function ($orderNo) {
    // In production, return an App URL for /customer/:orderNo
    $frontend = config('app.frontend_origin', 'http://localhost:5173');
    $url = $frontend . '/customer/' . urlencode($orderNo);
    return ['url' => $url];
});

Route::get('/orders/{orderNo}', [App\Http\Controllers\OrderController::class, 'show']);
