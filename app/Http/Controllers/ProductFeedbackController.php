<?php

namespace App\Http\Controllers;

use App\Models\ProductFeedback;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class ProductFeedbackController extends Controller
{
    private function getReasons()
    {
        if (Storage::disk('local')->exists('settings.json')) {
            $data = json_decode(Storage::disk('local')->get('settings.json'), true);
            if (!empty($data['reasons'])) {
                return $data['reasons'];
            }
        }

        return [
            'Price is higher than expected',
            'Unsure about size / fit / dimensions',
            'Shipping fee or delivery time is too high',
            'Product information or reviews missing',
        ];
    }

    private function getStats()
    {
        try {
            return [
                'total_feedbacks' => ProductFeedback::count(),
                'top_reason' => ProductFeedback::select('reason')
                    ->selectRaw('count(*) as total')
                    ->groupBy('reason')
                    ->orderByDesc('total')
                    ->first()?->reason ?? 'Price too high',
                'pending_ai_analysis' => ProductFeedback::whereNull('ai_summary')->count(),
            ];
        } catch (\Exception $e) {
            return [
                'total_feedbacks' => 0,
                'top_reason' => 'Price too high',
                'pending_ai_analysis' => 0,
            ];
        }
    }

    public function overview()
    {
        try {
            $feedbacks = ProductFeedback::latest()->take(10)->get();
        } catch (\Exception $e) {
            $feedbacks = collect([]);
        }

        return Inertia::render('Overview', [
            'feedbacks' => $feedbacks,
            'stats' => $this->getStats(),
        ]);
    }

    public function submissions()
    {
        try {
            $feedbacks = ProductFeedback::latest()->paginate(50);
        } catch (\Exception $e) {
            $feedbacks = collect([]);
        }

        return Inertia::render('Submissions', [
            'feedbacks' => $feedbacks,
            'stats' => $this->getStats(),
        ]);
    }

    public function settings()
    {
        return Inertia::render('Settings', [
            'reasons' => $this->getReasons(),
        ]);
    }

    public function saveSettings(Request $request)
    {
        $validated = $request->validate([
            'reasons' => 'required|array',
            'reasons.*' => 'required|string',
        ]);

        Storage::disk('local')->put('settings.json', json_encode([
            'reasons' => array_values(array_filter($validated['reasons'])),
        ]));

        return response()->json([
            'success' => true,
            'message' => 'Settings saved successfully!',
            'reasons' => $this->getReasons(),
        ]);
    }

    public function getApiSettings()
    {
        return response()->json([
            'success' => true,
            'reasons' => $this->getReasons(),
        ]);
    }

    public function pricing()
    {
        return Inertia::render('Pricing', [
            'current_plan' => 'Free Trial',
        ]);
    }

    public function setup()
    {
        return Inertia::render('Setup');
    }

    public function support()
    {
        return Inertia::render('Support');
    }

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

        try {
            $feedback = ProductFeedback::create($validated);
        } catch (\Exception $e) {
            $feedback = null;
        }

        return response()->json([
            'success' => true,
            'message' => 'Thank you for your feedback!',
            'feedback' => $feedback,
        ]);
    }
}
