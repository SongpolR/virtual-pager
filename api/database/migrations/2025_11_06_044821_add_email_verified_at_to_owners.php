<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
  public function up(): void {
    Schema::table('owners', function (Blueprint $t) {
      if (!Schema::hasColumn('owners','email_verified_at')) {
        $t->timestamp('email_verified_at')->nullable()->after('password');
      }
    });
  }
  public function down(): void {
    Schema::table('owners', function (Blueprint $t) {
      $t->dropColumn('email_verified_at');
    });
  }
};
