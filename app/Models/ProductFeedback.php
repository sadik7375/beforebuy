<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ProductFeedback extends Model
{
    use HasFactory;

    protected $table = 'product_feedbacks';

    protected $fillable = [
        'shop_domain',
        'product_id',
        'product_title',
        'product_handle',
        'reason',
        'custom_comment',
        'customer_email',
        'discount_code_issued',
        'ai_summary',
        'ai_sentiment',
    ];
}
