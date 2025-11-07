<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
  public function up(): void {
    Schema::table('shops', function (Blueprint $t) {
      if (!Schema::hasColumn('shops','seq_start')) $t->unsignedInteger('seq_start')->default(1)->after('order_mode');
      if (!Schema::hasColumn('shops','seq_reset_policy')) $t->enum('seq_reset_policy', ['NONE','DAILY'])->default('DAILY')->after('seq_start');
      if (!Schema::hasColumn('shops','last_seq_reset_date')) $t->date('last_seq_reset_date')->nullable()->after('seq_next');
      if (!Schema::hasColumn('shops','timezone')) $t->string('timezone', 64)->default('Asia/Bangkok')->after('sound_key');
    });
  }
  public function down(): void {
    Schema::table('shops', function (Blueprint $t) {
      $t->dropColumn(['seq_start','seq_reset_policy','last_seq_reset_date','timezone']);
    });
  }
};
