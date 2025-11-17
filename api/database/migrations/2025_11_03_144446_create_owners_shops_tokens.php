<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
  public function up(): void
  {
    Schema::create('owners', function (Blueprint $t) {
      $t->id();
      $t->string('name')->nullable();
      $t->string('email')->unique();
      $t->string('password'); // bcrypt
      $t->timestamp('email_verified_at')->nullable()->after('password');
      $t->timestamps();
    });

    Schema::create('owner_api_tokens', function (Blueprint $t) {
      $t->id();
      $t->foreignId('owner_id')->constrained()->cascadeOnDelete();
      $t->string('token', 80)->unique();
      $t->timestamp('last_used_at')->nullable();
      $t->timestamps();
    });

    Schema::create('shops', function (Blueprint $t) {
      $t->id();
      $t->foreignId('owner_id')->constrained('owners')->cascadeOnDelete();
      $t->string('name')->default('My Shop');
      $t->string('order_numbering_mode', 20)->default('sequential');
      $t->unsignedInteger('seq_start')->default(1);
      $t->enum('seq_reset_policy', ['none', 'daily'])->default('daily');
      $t->string('logo_url')->nullable();
      $t->unsignedInteger('seq_next')->default(1);
      $t->date('last_seq_reset_date')->nullable();
      $t->unsignedSmallInteger('random_min')->default(100);
      $t->unsignedSmallInteger('random_max')->default(999);
      $t->enum('sound_key', ['ding', 'bell', 'chime', 'ping', 'beep'])->default('ding');
      $t->string('timezone', 64)->default('Asia/Bangkok');
      $t->timestamps();
    });
  }

  public function down(): void
  {
    Schema::dropIfExists('shops');
    Schema::dropIfExists('owner_api_tokens');
    Schema::dropIfExists('owners');
  }
};
