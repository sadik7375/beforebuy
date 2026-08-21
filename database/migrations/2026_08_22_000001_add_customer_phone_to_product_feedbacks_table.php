<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (Schema::hasTable('product_feedbacks') && !Schema::hasColumn('product_feedbacks', 'customer_phone')) {
            Schema::table('product_feedbacks', function (Blueprint $table) {
                $table->string('customer_phone')->nullable()->after('customer_email');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('product_feedbacks') && Schema::hasColumn('product_feedbacks', 'customer_phone')) {
            Schema::table('product_feedbacks', function (Blueprint $table) {
                $table->dropColumn('customer_phone');
            });
        }
    }
};
