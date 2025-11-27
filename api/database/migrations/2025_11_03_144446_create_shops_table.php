<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
  public function up(): void
  {
    Schema::create('shops', function (Blueprint $t) {
      $t->id();
      $t->foreignId('owner_id')->constrained('owners')->cascadeOnDelete();
      $t->string('name')->default('My Shop');
      $t->string('logo_url')->nullable();
      $t->enum('sound_key', ['arcade', 'fairy', 'flute', 'game', 'happy-bell', 'marimba', 'slot-machine', 'toy-telephone', 'urgent'])->default('happy-bell');
      $t->string('timezone', 64)->default('Asia/Bangkok');
      $t->timestamps();
    });
  }

  public function down(): void
  {
    Schema::dropIfExists('shops');
  }
};
