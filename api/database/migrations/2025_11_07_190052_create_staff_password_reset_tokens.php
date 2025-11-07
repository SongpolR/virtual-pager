<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('staff_password_reset_tokens', function (Blueprint $t) {
            $t->string('email')->index();
            $t->string('token');   // hashed token
            $t->timestamp('created_at')->nullable();
        });
    }
    public function down(): void
    {
        Schema::dropIfExists('staff_password_reset_tokens');
    }
};
