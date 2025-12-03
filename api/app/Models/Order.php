<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Order extends Model
{
    protected $fillable = [
        'shop_id',
        'order_date',
        'order_no',
        'status',
        'items',
        'pos_ref',
        'created_by_type',
        'created_by_id',
        'ready_at',
        'done_at',
        'public_code'
    ];

    protected $casts = [
        'order_date' => 'date',
        'ready_at'   => 'datetime',
        'done_at'    => 'datetime',
        'items'      => 'array',
    ];
}
