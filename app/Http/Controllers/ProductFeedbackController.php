<?php

namespace App\Http\Controllers;

use App\Models\ProductFeedback;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ProductFeedbackController extends Controller
{
    /**
     * Display the merchant feedback dashboard.
     */
    public function index(Request $request)
    {
        $feedbacks = ProductFeedback::latest()->take(100)->get();

        $stats = [
            'total_feedbacks' => ProductFeedback::count(),
            'top_reason' => ProductFeedback::select('reason')
                ->selectRaw('count(*) as total')
                ->groupBy('reason')
                ->orderByDesc('total')
                ->first()?->reason ?? 'Price too high',
            'pending_ai_analysis' => ProductFeedback::whereNull('ai_summary')->count(),
        ];

        return Inertia::render('Dashboard', [
            'feedbacks' => $feedbacks,
            'stats' => $stats,
        ]);
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
