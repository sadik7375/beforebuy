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
        Schema::create('product_feedbacks', function (Blueprint $table) {
            $table->id();
            $table->string('shop_domain')->nullable()->index();
            $table->string('product_id')->nullable()->index();
            $table->string('product_title')->nullable();
            $table->string('product_handle')->nullable();
            $table->string('reason'); // e.g. "Price too high", "Unsure about size", "Shipping fee", "Missing details", "Other"
            $table->text('custom_comment')->nullable();
            $table->string('customer_email')->nullable();
            $table->string('discount_code_issued')->nullable();
            
            // AI Integration Fields (Kept ready for future AI analysis)
            $table->text('ai_summary')->nullable();
            $table->string('ai_sentiment')->default('pending'); // pending, positive, negative, neutral
            
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('product_feedbacks');
    }
};
