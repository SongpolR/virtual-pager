<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
  public function up(): void {
    Schema::create('staff', function (Blueprint $t) {
      $t->id();
      $t->foreignId('shop_id')->constrained('shops')->cascadeOnDelete();
      $t->string('name')->nullable();
      $t->string('email')->unique();
      $t->string('password'); // bcrypt
      $t->boolean('is_active')->default(true);
      $t->timestamps();
    });

    Schema::create('staff_api_tokens', function (Blueprint $t) {
      $t->id();
      $t->foreignId('staff_id')->constrained('staff')->cascadeOnDelete();
      $t->string('token', 80)->unique();
      $t->timestamp('last_used_at')->nullable();
      $t->timestamps();
    });
  }

  public function down(): void {
    Schema::dropIfExists('staff_api_tokens');
    Schema::dropIfExists('staff');
  }
};
