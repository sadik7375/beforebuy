<?php

namespace App\Http\Controllers;

use App\Models\ProductFeedback;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ProductFeedbackController extends Controller
{
    /**
     * Get shared stats helper
     */
    private function getStats()
    {
        return [
            'total_feedbacks' => ProductFeedback::count(),
            'top_reason' => ProductFeedback::select('reason')
                ->selectRaw('count(*) as total')
                ->groupBy('reason')
                ->orderByDesc('total')
                ->first()?->reason ?? 'Price too high',
            'pending_ai_analysis' => ProductFeedback::whereNull('ai_summary')->count(),
        ];
    }

    /**
     * Overview Submenu Page
     */
    public function overview()
    {
        $feedbacks = ProductFeedback::latest()->take(10)->get();

        return Inertia::render('Overview', [
            'feedbacks' => $feedbacks,
            'stats' => $this->getStats(),
        ]);
    }

    /**
     * Customer Feedback Submissions Submenu Page
     */
    public function submissions()
    {
        $feedbacks = ProductFeedback::latest()->paginate(50);

        return Inertia::render('Submissions', [
            'feedbacks' => $feedbacks,
            'stats' => $this->getStats(),
        ]);
    }

    /**
     * App Settings Submenu Page
     */
    public function settings()
    {
        return Inertia::render('Settings', [
            'reasons' => [
                'Price is higher than expected',
                'Unsure about size / fit / dimensions',
                'Shipping fee or delivery time is too high',
                'Product information or reviews missing',
                'Other reason'
            ],
            'discount_code' => 'BEFOREBUY10',
        ]);
    }

    /**
     * Price Plan Submenu Page
     */
    public function pricing()
    {
        return Inertia::render('Pricing', [
            'current_plan' => 'Free Trial',
        ]);
    }

    /**
     * Setup Guide Submenu Page
     */
    public function setup()
    {
        return Inertia::render('Setup');
    }

    /**
     * Merchant Support Submenu Page
     */
    public function support()
    {
        return Inertia::render('Support');
    }

    /**
     * Store new customer feedback from storefront popup.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'shop_domain' => 'nullable|string',
            'product_id' => 'nullable|string',
            'product_title' => 'nullable|string',
            'product_handle' => 'nullable|string',
            'reason' => 'required|string',
            'custom_comment' => 'nullable|string',
            'customer_email' => 'nullable|email',
        ]);

        $feedback = ProductFeedback::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Thank you for your feedback!',
            'feedback' => $feedback,
        ]);
    }
}
