<?php

namespace App\Http\Controllers;

use App\Models\Order;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class OrderController extends Controller
{
    /**
     * List today's orders for the current shop.
     * Optional: ?status=pending|ready|done
     */
    public function index(Request $req)
    {
        $shopId = $req->attributes->get('shop_id'); // from AnyTokenAuth
        $status = $req->query(key: 'status');

        $today = now()->timezone(config('app.timezone', 'UTC'))->toDateString();

        $q = Order::where('shop_id', $shopId)
            ->whereDate('order_date', $today)
            ->orderBy('created_at', 'asc');

        if ($status) {
            $q->where('status', $status);
        }

        $orders = $q->get([
            'id',
            'order_no',
            'status',
            'items',
            'pos_ref',
            'created_at',
            'ready_at',
            'done_at',
            'public_code',
        ]);

        return response()->json([
            'success' => true,
            'data'    => $orders,
        ], 200);
    }

    /**
     * Create a new order.
     *
     * Body may include:
     *  - order_no (optional override; otherwise auto-generated)
     *  - items    (optional array)
     *  - pos_ref  (optional string)
     */
    public function store(Request $req)
    {
        $shopId     = $req->attributes->get('shop_id');
        $actorType  = $req->attributes->get('actor_type'); // 'owner' | 'staff' (if you set this)
        $actorId    = $req->attributes->get('actor_id');

        // Use app timezone, we care about the date portion for daily reset
        $today = now()->timezone(config('app.timezone', 'UTC'))->toDateString();

        // Basic validation for incoming data
        $data = $req->validate([
            'order_no'       => ['nullable', 'string', 'max:50'],
            'pos_ref'        => ['nullable', 'string', 'max:100'],
            'items'          => ['nullable', 'array', 'max:50'], // max 50 line items
            'items.*.name'   => ['nullable', 'string', 'max:255'],
            'items.*.qty'    => ['nullable', 'numeric'],
            'items.*.note'   => ['nullable', 'string', 'max:255'],
            // you can extend with price, sku, etc. later
        ]);

        // Load shop (we still verify shop exists, even if we no longer use numbering_mode)
        $shop = DB::table('shops')->where('id', $shopId)->first();
        if (!$shop) {
            return response()->json([
                'message' => 'Shop not found',
                'errors'  => [config('errorcodes.UNKNOWN') ?? 9000],
            ], 404);
        }

        try {
            $order = DB::transaction(function () use ($shopId, $today, $actorType, $actorId, $data) {
                $providedOrderNo = isset($data['order_no']) && $data['order_no'] !== ''
                    ? trim($data['order_no'])
                    : null;

                // 1) If order_no provided (e.g. from POS or manual override),
                //    we just enforce uniqueness for (shop_id + date).
                if ($providedOrderNo !== null) {
                    $exists = Order::where('shop_id', $shopId)
                        ->whereDate('order_date', $today)
                        ->where('order_no', $providedOrderNo)
                        ->exists();

                    if ($exists) {
                        throw new \RuntimeException('ORDER_NO_CONFLICT');
                    }

                    $orderNo = $providedOrderNo;
                } else {
                    // 2) No order_no provided → generate daily sequential 3-digit 001–999
                    $orderNo = $this->generateOrderNo($shopId, $today);
                }

                $now = now();

                $order = Order::create([
                    'shop_id'         => $shopId,
                    'order_date'      => $today,          // date portion; can be cast to datetime by Eloquent
                    'order_no'        => $orderNo,
                    'status'          => 'pending',
                    'items'           => $data['items'] ?? null,
                    'pos_ref'         => $data['pos_ref'] ?? null,
                    'created_by_type' => $actorType,
                    'created_by_id'   => $actorId,
                    'created_at'      => $now,
                    'updated_at'      => $now,
                    'public_code'     => Str::uuid(),
                ]);

                return $order;
            });
        } catch (\RuntimeException $e) {
            if ($e->getMessage() === 'ORDER_NO_CONFLICT') {
                return response()->json([
                    'message' => 'Order number already exists for today.',
                    'errors'  => [config('errorcodes.ORDER_NUMBERING_FAILED')],
                ], 422);
            }

            if ($e->getMessage() === 'ORDER_NO_OVERFLOW') {
                return response()->json([
                    'message' => 'Maximum number of orders reached for today.',
                    'errors'  => [config('errorcodes.ORDER_NUMBERING_FAILED')],
                ], 422);
            }

            return response()->json([
                'message' => 'Failed to generate order number',
                'errors'  => [config('errorcodes.ORDER_NUMBERING_FAILED')],
            ], 422);
        } catch (\Throwable $e) {
            return response()->json([
                'message' => 'Failed to create order',
                'errors'  => [config('errorcodes.UNKNOWN') ?? 9000],
            ], 500);
        }

        return response()->json([
            'id'         => $order->id,
            'order_no'   => $order->order_no,
            'status'     => $order->status,
            'items'      => $order->items,
            'pos_ref'    => $order->pos_ref,
            'created_at' => $order->created_at,
        ], 201);
    }

    /**
     * Mark order as READY.
     */
    public function ready(Request $req, $id)
    {
        return $this->changeStatus($req, $id, 'ready');
    }

    /**
     * Mark order as DONE.
     */
    public function done(Request $req, $id)
    {
        return $this->changeStatus($req, $id, 'done');
    }

    // ----------------- Helpers -----------------

    protected function changeStatus(Request $req, $id, string $toStatus)
    {
        $shopId = $req->attributes->get('shop_id');
        if (!$shopId) {
            return response()->json([
                'success' => false,
                'message' => 'UNAUTHORIZED',
                'errors'  => [config('errorcodes.UNAUTHORIZED')],
            ], 401);
        }

        $now    = now();

        $order = Order::where('shop_id', $shopId)
            ->where('id', $id)
            ->first();

        if (!$order) {
            return response()->json([
                'message' => 'Order not found',
                'errors'  => [config('errorcodes.ORDER_NOT_FOUND')],
            ], 404);
        }

        $from = $order->status;

        // Valid transitions: pending -> ready -> done
        $valid = match ($from) {
            'pending' => $toStatus === 'ready',
            'ready'   => $toStatus === 'done',
            default   => false,
        };

        if (!$valid) {
            return response()->json([
                'message' => 'Invalid status transition',
                'errors'  => [config('errorcodes.ORDER_INVALID_TRANSITION')],
            ], 422);
        }

        $order->status = $toStatus;
        if ($toStatus === 'ready') {
            $order->ready_at = $now;
        }
        if ($toStatus === 'done') {
            $order->done_at = $now;
        }
        $order->updated_at = $now;
        $order->save();

        // 🔔 Broadcast to realtime server (Socket.IO bridge)
        $this->broadcastOrderStatus($order);

        return response()->json([
            'id'        => $order->id,
            'order_no'  => $order->order_no,
            'status'    => $order->status,
            'items'     => $order->items,
            'pos_ref'   => $order->pos_ref,
            'ready_at'  => $order->ready_at,
            'done_at'   => $order->done_at,
        ]);
    }

    /**
     * Auto-generate an order number when not provided.
     *
     * Simple scheme:
     *  - Per shop per day, sequential 3-digit number: 001, 002, ..., 999
     *  - Resets every date (we filter by order_date using whereDate)
     */
    protected function generateOrderNo(int $shopId, string $date): string
    {
        // Use GLOB instead of REGEXP for SQLite compatibility
        $max = Order::where('shop_id', $shopId)
            ->whereDate('order_date', $date)
            ->whereRaw("order_no GLOB '[0-9][0-9][0-9]'")
            ->max('order_no');

        $next = $max ? ((int) $max + 1) : 1;

        if ($next > 999) {
            throw new \RuntimeException('ORDER_NO_OVERFLOW');
        }

        return str_pad((string) $next, 3, '0', STR_PAD_LEFT);
    }

    /**
     * Public order view for customer page by public_code.
     */
    public function showPublic(string $publicCode)
    {
        $order = Order::where('public_code', $publicCode)->first();

        if (!$order) {
            return response()->json([
                "success" => false,
                "message" => "ORDER_NOT_FOUND",
            ], 404);
        }

        $shop = DB::table('shops')
            ->where('id', $order->shop_id)
            ->first();

        return response()->json([
            "success" => true,
            "data" => [
                "order" => $order,
                "shop"  => $shop,
            ],
        ], 200);
    }

    /**
     * Notify realtime server about status change.
     * Expects a bridge server with POST /broadcast/order-status
     * that then emits "order_status_updated" via Socket.IO.
     */
    protected function broadcastOrderStatus(Order $order): void
    {
        // You can also configure this in config/services.php → 'realtime.url'
        $baseUrl = config('services.realtime.url', env('REALTIME_URL'));
        $apiSecret  = config('services.realtime.api_secret', env('REALTIME_API_SECRET'));

        if (!$baseUrl || !$apiSecret) {
            return;
        }

        try {
            Http::timeout(2)
                ->withHeaders([
                    'X-Broadcast-Secret' => $apiSecret,
                ])
                ->post(rtrim($baseUrl, '/') . '/broadcast/order-status', [
                    'order_id' => $order->id,
                    'status'   => $order->status,
                ]);
        } catch (\Throwable $e) {
            Log::warning('Realtime broadcast failed', [
                'order_id' => $order->id,
                'status'   => $order->status,
                'error'    => $e->getMessage(),
            ]);
        }
    }
}
