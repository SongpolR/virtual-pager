<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('orders', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('shop_id');
            $table->date('order_date');              // for daily scoping
            $table->string('order_no', 50);          // display/order code (can be POS-provided)
            $table->uuid('public_code')
                ->unique()
                ->nullable();
            $table->enum('status', ['pending', 'ready', 'done'])->default('pending');

            $table->json('items')->nullable();       // POS / app-provided items
            $table->string('pos_ref', 100)->nullable(); // external POS order reference

            // audit
            $table->string('created_by_type', 10)->nullable(); // 'owner' | 'staff'
            $table->unsignedBigInteger('created_by_id')->nullable();

            $table->timestamp('ready_at')->nullable();
            $table->timestamp('done_at')->nullable();

            $table->timestamps();

            $table->foreign('shop_id')
                ->references('id')
                ->on('shops')
                ->onDelete('cascade');

            // no duplicate order_no per shop per day
            $table->unique(['shop_id', 'order_date', 'order_no']);
            $table->index(['shop_id', 'order_date']);
            $table->index(['shop_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('orders');
    }
};
