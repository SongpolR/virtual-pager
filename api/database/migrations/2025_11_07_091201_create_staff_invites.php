<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
  public function up(): void {
    Schema::create('staff_invites', function (Blueprint $t) {
      $t->id();
      $t->foreignId('shop_id')->constrained('shops')->cascadeOnDelete();
      $t->string('email')->index();
      $t->string('name')->nullable();
      $t->string('token', 64)->unique();   // plain token sent via email
      $t->timestamp('expires_at')->nullable(); // e.g., +72 hours
      $t->timestamp('accepted_at')->nullable();
      $t->timestamps();
    });
  }
  public function down(): void {
    Schema::dropIfExists('staff_invites');
  }
};
