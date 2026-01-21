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
      $t->timestamp('email_verified_at')->nullable();
      $t->timestamps();
    });
  }

  public function down(): void
  {
    Schema::dropIfExists('owners');
  }
};
